const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    let summary = {
      cash_advance_links: 0,
      settlement_links: 0,
      conflicts: 0,
      skipped_records: 0,
      updated_records: 0
    };

    const [caRows] = await conn.query(`SELECT id, advance_no, transaction_id FROM cash_advances WHERE transaction_id IS NOT NULL`);
    const [stlRows] = await conn.query(`SELECT id, settlement_no, transaction_id FROM settlements WHERE transaction_id IS NOT NULL`);
    
    // Map of transaction_id -> array of { type: 'CA' or 'STL', id, no }
    const linksMap = {};
    
    caRows.forEach(ca => {
      if (!linksMap[ca.transaction_id]) linksMap[ca.transaction_id] = [];
      linksMap[ca.transaction_id].push({ type: 'CASH_ADVANCE_DISBURSEMENT', id: ca.id, no: ca.advance_no });
    });
    
    stlRows.forEach(stl => {
      if (!linksMap[stl.transaction_id]) linksMap[stl.transaction_id] = [];
      linksMap[stl.transaction_id].push({ type: 'SETTLEMENT_POSTING', id: stl.id, no: stl.settlement_no });
    });

    const [transactions] = await conn.query(`SELECT id, source_type FROM transactions`);
    
    await conn.beginTransaction();

    for (const trx of transactions) {
      const links = linksMap[trx.id];
      if (!links || links.length === 0) {
        continue;
      }
      
      if (links.length > 1) {
        console.warn(`CONFLICT DETECTED: Transaction ${trx.id} is linked to multiple documents:`, links.map(l => l.no).join(', '));
        summary.conflicts++;
        summary.skipped_records++;
        continue;
      }
      
      const link = links[0];
      
      if (trx.source_type !== null) {
        summary.skipped_records++;
        continue;
      }
      
      await conn.query(
        `UPDATE transactions SET source_type = ?, source_id = ?, source_number = ?, is_system_generated = 1 WHERE id = ?`,
        [link.type, link.id, link.no, trx.id]
      );
      
      if (link.type === 'CASH_ADVANCE_DISBURSEMENT') summary.cash_advance_links++;
      if (link.type === 'SETTLEMENT_POSTING') summary.settlement_links++;
      summary.updated_records++;
    }

    await conn.commit();
    console.log("Migration 026 Backfill Completed.");
    console.log("Summary:", summary);

  } catch (err) {
    console.error("Migration failed:", err);
    await conn.rollback();
  } finally {
    await conn.end();
  }
}

run();
