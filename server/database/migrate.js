const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
  console.log('[Migration] Starting MySQL database migration...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'org_finance_db',
    multipleStatements: true
  });

  try {
    const sqlFilePath = path.join(__dirname, 'init.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log(`[Migration] Executing SQL script: ${sqlFilePath}`);
    await connection.query(sqlContent);
    
    console.log('[Migration] Database tables and initial seed data created successfully!');
  } catch (error) {
    console.error('[Migration Error] Failed to run migration:', error.message);
  } finally {
    await connection.end();
  }
}

runMigration();
