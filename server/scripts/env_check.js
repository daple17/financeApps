const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const composeFile = fs.readFileSync(path.join(__dirname, '../../docker-compose.yml'), 'utf8');
const composeServices = [];
const lines = composeFile.split('\n');
lines.forEach(line => {
    if (line.match(/^  [a-zA-Z0-9_-]+:/)) {
        composeServices.push(line.trim().replace(':', ''));
    }
});

console.log("=== 1. ENVIRONMENT CHECK ===");
console.log("Resolved DB host:", process.env.MYSQLHOST || process.env.DB_HOST || 'localhost');
console.log("Resolved DB port:", process.env.MYSQLPORT || process.env.DB_PORT || 3306);
console.log("Resolved DB name:", process.env.MYSQLDATABASE || process.env.DB_NAME || 'org_finance_db');
console.log("Detected Compose service names:", composeServices.join(', '));

async function testConnection() {
    try {
        const conn = await mysql.createConnection({
            host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
            port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
            user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
            password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
            database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'org_finance_db'
        });
        console.log("Database connection: SUCCESS");
        await conn.end();
        process.exit(0);
    } catch (e) {
        console.error("Database connection: UNAVAILABLE");
        console.error(e.message);
        process.exit(2);
    }
}

testConnection();
