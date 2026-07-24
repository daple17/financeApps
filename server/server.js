const app = require('./app');
const db = require('./config/db');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

async function autoMigrate() {
  const connection = await db.getConnection();
  try {
    // 1. Rename tables if they have the old name
    const renameQueries = [
      "RENAME TABLE job_order_export_details TO export_details",
      "RENAME TABLE job_order_import_details TO import_details",
      "RENAME TABLE job_order_trucking_details TO trucking_details",
      "RENAME TABLE job_order_trucking_containers TO trucking_containers"
    ];
    for (let query of renameQueries) {
      try {
        await connection.query(query);
        console.log(`[Auto-Migrate] Sukses Rename: ${query}`);
      } catch (err) {
        // Abaikan error jika tabel tidak ada / sudah di-rename
      }
    }

    // 2. Run CREATE TABLE IF NOT EXISTS scripts (001, 002, 003, 004)
    const migrationsDir = path.join(__dirname, 'database', 'migrations');
    const files = ['001_job_orders.sql', '002_export_details.sql', '003_import_details.sql', '004_trucking_details.sql', '006_project_details.sql'];
    
    for (let file of files) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        // split by ';' and execute
        const statements = sqlContent.split(';').filter(s => s.trim().length > 0);
        for (let stmt of statements) {
          try {
            await connection.query(stmt);
          } catch(err) {
            console.error(`[Auto-Migrate] Error on stmt in ${file}:`, err.message);
          }
        }
      }
    }
    console.log('[Auto-Migrate] Selesai memastikan tabel Job Order tersedia.');

  } catch (err) {
    console.error('[Auto-Migrate] Error:', err.message);
  } finally {
    connection.release();
  }
}

app.listen(PORT, async () => {
  // Jalankan migrasi dan perbaikan tabel secara otomatis untuk Railway
  await autoMigrate();
  
  console.log(`==================================================`);
  console.log(`🚀 Organization Finance API Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`==================================================`);
});
