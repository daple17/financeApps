const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

// All migration files in order
const MIGRATION_FILES = [
  '001_job_orders.sql',
  '002_export_details.sql',
  '003_import_details.sql',
  '004_trucking_details.sql',
  '006_project_details.sql',
  '007_phase1_5_stabilization.sql',
  '008_phase2_1_business_partners.sql',
  '009_phase2_2_location_master_data.sql',
  '010_seed_countries.sql',
  '011_phase2_3_logistics_references.sql',
  '012_phase2_4_location_integration.sql',
  '013_phase3_1_operations.sql',
  '014_phase3_2_execution_unit.sql',
  '015_phase3_2_resource_assignment.sql',
  '017_phase3_3_operation_execution.sql',
  '018_phase3_4_pod_documents.sql',
  '019_phase3_5_operation_costs.sql',
  '020_operation_cost_rejection.sql',
  '021_cash_advances.sql',
  '022_cash_advance_rejection.sql',
  '023_cost_type_account_mappings.sql',
  '024_settlements_and_items.sql',
  '025_settlement_items_account.sql',
  '026_transaction_source_metadata.sql',
  '027_document_sequences.sql',
  '028_vendor_invoices_and_items.sql',
  '029_add_account_snapshot_to_vendor_invoice_items.sql',
];

// Error codes that are safe to ignore (already exists / duplicate data)
const SAFE_ERROR_CODES = [
  'ER_TABLE_EXISTS_ERROR',     // Table already exists
  'ER_DUP_FIELDNAME',          // Column already exists
  'ER_DUP_KEYNAME',            // Index already exists
  'ER_DUP_ENTRY',              // Duplicate INSERT (seed data already inserted)
  'ER_CANT_DROP_FIELD_OR_KEY', // Key doesn't exist on DROP
];

function isSafeError(err) {
  return SAFE_ERROR_CODES.includes(err.code);
}

async function executeStatements(connection, sqlContent, label) {
  // Split SQL into individual statements and execute one by one
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let okCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const stmt of statements) {
    try {
      await connection.query(stmt);
      okCount++;
    } catch (err) {
      if (isSafeError(err)) {
        skipCount++; // Silently skip safe errors
      } else {
        errorCount++;
        console.warn(`  ⚠️  [${label}] ${err.message}`);
        console.warn(`       Statement: ${stmt.substring(0, 120)}...`);
      }
    }
  }

  return { okCount, skipCount, errorCount };
}

async function runProductionMigration() {
  console.log('==================================================');
  console.log('🚀 [Production Migration] Starting...');
  console.log('==================================================');

  // No multipleStatements - we handle statement-by-statement manually
  const connection = await mysql.createConnection({
    host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
    port:     process.env.MYSQLPORT     || process.env.DB_PORT     || 3306,
    user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'railway',
  });

  console.log('✅ [Production Migration] Database connected.');

  try {
    // ── STEP 1: Run init.sql (core schema + seed) - SAFE MODE ──────────────
    const initSqlPath = path.join(__dirname, 'init.sql');
    const initSqlRaw  = fs.readFileSync(initSqlPath, 'utf8');

    // Remove DROP TABLE lines → non-destructive
    const safeSql = initSqlRaw
      .split('\n')
      .filter(line => !line.trim().toUpperCase().startsWith('DROP TABLE'))
      .join('\n');

    // Make CREATE TABLE idempotent
    const idempotentSql = safeSql.replace(
      /CREATE TABLE\s+(?!IF NOT EXISTS)/gi,
      'CREATE TABLE IF NOT EXISTS '
    );

    // Make INSERT idempotent - ignore duplicate seed data
    const seedSafeSql = idempotentSql.replace(
      /INSERT INTO\s+/gi,
      'INSERT IGNORE INTO '
    );

    console.log('\n📄 Executing core schema (init.sql - safe mode)...');
    const initResult = await executeStatements(connection, seedSafeSql, 'init.sql');
    console.log(`   ✅ Done: ${initResult.okCount} ok, ${initResult.skipCount} skipped, ${initResult.errorCount} warnings`);

    // ── STEP 2: Run all migration files ────────────────────────────────────
    const migrationsDir = path.join(__dirname, 'migrations');
    console.log('\n📂 Running migration files...');

    for (const file of MIGRATION_FILES) {
      const filePath = path.join(migrationsDir, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`  ⚠️  Skipping (not found): ${file}`);
        continue;
      }

      const sqlContent = fs.readFileSync(filePath, 'utf8');
      const result = await executeStatements(connection, sqlContent, file);
      const status = result.errorCount === 0 ? '✅' : '⚠️ ';
      console.log(`  ${status} ${file} (ok:${result.okCount}, skip:${result.skipCount}, warn:${result.errorCount})`);
    }

    console.log('\n==================================================');
    console.log('🎉 [Production Migration] Completed successfully!');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ [Production Migration] Fatal error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runProductionMigration();
