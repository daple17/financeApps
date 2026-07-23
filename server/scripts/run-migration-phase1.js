const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runPhase1Migration() {
  console.log('[Migration Phase 1] Starting MySQL database migration...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'org_finance_db',
    multipleStatements: true
  });

  try {
    const sqlFilePath = path.join(__dirname, '../database/migrations/001_phase1_job_orders.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log(`[Migration Phase 1] Executing SQL script: ${sqlFilePath}`);
    await connection.query(sqlContent);
    
    console.log('[Migration Phase 1] Job Orders tables created successfully!');
  } catch (error) {
    console.error('[Migration Phase 1 Error] Failed to run migration:', error.message);
  } finally {
    await connection.end();
  }
}

runPhase1Migration();
