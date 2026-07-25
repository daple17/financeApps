const db = require('../config/db');
const JobOrderModel = require('../models/jobOrderModel');

async function run() {
  console.log("Starting Job Order Status Reconciliation...");
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query('SELECT id, job_order_number, job_status FROM job_orders');
    console.log(`Found ${rows.length} Job Orders to check.`);

    let synced = 0;
    let skipped = 0;
    let inconsistent = 0;

    for (const jo of rows) {
      if (['CANCELLED', 'CLOSED'].includes(jo.job_status)) {
        console.log(`[SKIP] JO ${jo.job_order_number} is ${jo.job_status}`);
        skipped++;
        continue;
      }
      if (jo.job_status === 'ASSIGNED') {
        console.log(`[REPORT] JO ${jo.job_order_number} is ASSIGNED (Legacy status). Preserved.`);
        skipped++;
        continue;
      }
      if (jo.job_status === 'DRAFT') {
        const [ops] = await conn.query('SELECT status FROM operations WHERE job_order_id = ? AND status != "CANCELLED"', [jo.id]);
        if (ops.length > 0) {
          console.log(`[INCONSISTENT] JO ${jo.job_order_number} is DRAFT but has ${ops.length} active operations! Needs manual review.`);
          inconsistent++;
        } else {
           console.log(`[SKIP] JO ${jo.job_order_number} is normal DRAFT.`);
        }
        skipped++;
        continue;
      }

      try {
        const result = await JobOrderModel.syncStatusFromOperations(jo.id);
        if (result.changed) {
          console.log(`[SYNCED] JO ${jo.job_order_number} changed from ${jo.job_status} to ${result.status}`);
          synced++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`[ERROR] JO ${jo.job_order_number}: ${err.message}`);
      }
    }

    console.log(`\nReconciliation Complete.`);
    console.log(`Synced: ${synced}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Inconsistent: ${inconsistent}`);

  } catch (err) {
    console.error("Fatal Error:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
