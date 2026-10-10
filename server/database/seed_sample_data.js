const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const SEED_FILES = [
  'sample_master_data.sql',
];

async function runSampleSeed() {
  console.log('==================================================');
  console.log('🌱 [Sample Seed] Starting...');
  console.log('==================================================');

  const connection = await mysql.createConnection({
    host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
    port:     process.env.MYSQLPORT     || process.env.DB_PORT     || 3306,
    user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'railway',
  });

  let failed = 0;
  try {
    for (const file of SEED_FILES) {
      const sqlContent = fs.readFileSync(path.join(__dirname, 'seeds', file), 'utf8');
      const statements = sqlContent
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        try {
          const [result] = await connection.query(stmt);
          const table = (stmt.match(/INTO\s+(\w+)/i) || [])[1];
          console.log(`  ✅ ${table}: ${result.affectedRows} row(s) inserted`);
        } catch (err) {
          failed++;
          console.error(`  ❌ ${err.message}`);
          console.error(`     Statement: ${stmt.substring(0, 120)}...`);
        }
      }
    }
  } finally {
    await connection.end();
  }

  if (failed > 0) {
    throw new Error(`Finished with ${failed} error(s)`);
  }
  console.log('\n🎉 [Sample Seed] Completed successfully!');
}

module.exports = runSampleSeed;

if (require.main === module) {
  runSampleSeed().catch(err => {
    console.error('❌ [Sample Seed] Fatal error:', err.message);
    process.exit(1);
  });
}
