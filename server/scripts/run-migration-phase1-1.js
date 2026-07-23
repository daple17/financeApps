const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runPhase1_1Migration() {
  console.log('[Migration Phase 1.1] Starting MySQL database migration...');
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'financial_app',
      multipleStatements: true
    });
    
    const migrationPath = path.join(__dirname, '../database/migrations/002_phase1_1_job_order_types.sql');
    console.log(`[Migration Phase 1.1] Executing SQL script: ${migrationPath}`);
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await connection.query(sql);
    
    console.log('[Migration Phase 1.1] Job Orders Phase 1.1 tables and columns created successfully!');
  } catch (error) {
    console.error('[Migration Phase 1.1] Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

runPhase1_1Migration();
