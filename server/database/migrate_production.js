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

async function runProductionMigration() {
  console.log('==================================================');
  console.log('🚀 [Production Migration] Starting...');
  console.log('==================================================');

  const connection = await mysql.createConnection({
    host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
    port:     process.env.MYSQLPORT     || process.env.DB_PORT     || 3306,
    user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'railway',
    multipleStatements: true,
  });

  console.log('✅ [Production Migration] Database connected.');

  try {
    // ── STEP 1: Run init.sql (core schema + seed) - SAFE MODE ──────────────
    const initSqlPath = path.join(__dirname, 'init.sql');
    const initSqlRaw  = fs.readFileSync(initSqlPath, 'utf8');

    // Remove DROP TABLE lines to make it non-destructive
    const safeSql = initSqlRaw
      .split('\n')
      .filter(line => !line.trim().toUpperCase().startsWith('DROP TABLE'))
      .join('\n');

    // Make CREATE TABLE idempotent
    const idempotentSql = safeSql.replace(
      /CREATE TABLE\s+(?!IF NOT EXISTS)/gi,
      'CREATE TABLE IF NOT EXISTS '
    );

    console.log('\n📄 Executing core schema (init.sql - safe mode)...');
    await connection.query(idempotentSql);
    console.log('✅ Core schema applied.');

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
      const statements = sqlContent.split(';').map(s => s.trim()).filter(s => s.length > 0);

      let hasError = false;
      for (const stmt of statements) {
        try {
          await connection.query(stmt);
        } catch (err) {
          // Safely ignore "already exists" type errors
          const safeErrors = ['ER_TABLE_EXISTS_ERROR', 'ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME'];
          if (!safeErrors.includes(err.code)) {
            hasError = true;
            console.warn(`    ⚠️  [${file}] ${err.message}`);
          }
        }
      }
      console.log(`  ${hasError ? '⚠️ ' : '✅'} ${file}`);
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
