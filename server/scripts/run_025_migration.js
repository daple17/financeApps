const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigration() {
  const connection = await db.getConnection();
  try {
    const sqlPath = path.join(__dirname, '../database/migrations/025_settlement_items_account.sql');
    const sqlStr = fs.readFileSync(sqlPath, 'utf8');
    const statements = sqlStr.split(';').map(s => s.trim()).filter(s => s.length > 0);

    for (const stmt of statements) {
      console.log(`Executing: ${stmt.substring(0, 50)}...`);
      await connection.query(stmt);
    }
    console.log('Migration 025 completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigration();
