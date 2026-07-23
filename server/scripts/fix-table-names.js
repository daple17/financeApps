const db = require('../config/db');

async function fixTableNames() {
  console.log('🔄 Memulai proses perbaikan nama tabel (Migration 005)...');
  const connection = await db.getConnection();
  
  try {
    const queries = [
      "RENAME TABLE job_order_export_details TO export_details",
      "RENAME TABLE job_order_import_details TO import_details",
      "RENAME TABLE job_order_trucking_details TO trucking_details",
      "RENAME TABLE job_order_trucking_containers TO trucking_containers"
    ];

    for (let query of queries) {
      try {
        await connection.query(query);
        console.log(`✅ Sukses: ${query}`);
      } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          console.log(`⚠️ Tabel lama tidak ditemukan (mungkin sudah di-rename): ${query}`);
        } else if (err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`⚠️ Tabel baru sudah ada: ${query}`);
        } else {
          console.log(`❌ Error pada query: ${query}`, err.message);
        }
      }
    }
    
    console.log('🎉 Selesai memperbaiki nama tabel!');
  } catch (err) {
    console.error('❌ Terjadi kesalahan fatal:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

fixTableNames();
