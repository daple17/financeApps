const mysql = require('mysql2/promise');
require('dotenv').config();
const TransactionService = require('../services/transactionService');
const TransactionController = require('../controllers/transactionController');

async function runTests() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log("=== PHASE 4.6C TARGETED TESTS ===");
    let passed = 0;

    // Test A: Public Transaction API attempts source_type injection
    // Should be ignored
    const mockReqA = {
      body: {
        date: '2026-08-01', type: 'EXPENSE', description: 'Test A', amount: 1000,
        sourceType: 'HACKED', sourceId: 999, sourceNumber: 'HACKED',
        journalEntries: [
            { accountId: 5000, type: 'DEBIT', amount: 1000 },
            { accountId: 1001, type: 'CREDIT', amount: 1000 }
        ]
      },
      user: { id: 1 }
    };
    let trxIdA;
    const mockResA = {
      status: (code) => ({ json: (data) => { 
        if (code === 201) trxIdA = data.data; 
      }})
    };
    await TransactionController.create(mockReqA, mockResA, (err) => { if(err) throw err; });
    const [rowsA] = await conn.query('SELECT source_type FROM transactions WHERE id=?', [trxIdA.id || trxIdA]);
    if (rowsA[0].source_type === null) passed++;
    else throw new Error("Source type injection not prevented");

    // Test D: System-generated Transaction update/delete
    // We update trxIdA to pretend it's system-generated
    await conn.query("UPDATE transactions SET source_type='SETTLEMENT_POSTING' WHERE id=?", [trxIdA.id || trxIdA]);
    
    const mockReqD = { params: { id: trxIdA.id || trxIdA } };
    let codeD = 0;
    const mockResD = { status: (code) => ({ json: () => { codeD = code; } }) };
    await TransactionController.update(mockReqD, mockResD, () => {});
    if (codeD === 409) passed++;
    else throw new Error("System-generated update not blocked");

    // Test E: Normal manual Transaction update behavior
    await conn.query("UPDATE transactions SET source_type=NULL WHERE id=?", [trxIdA.id || trxIdA]);
    let codeE = 0;
    const mockResE = { status: (code) => ({ json: () => { codeE = code; } }) };
    await TransactionController.update(mockReqD, mockResE, () => {});
    if (codeE === 501) passed++; // 501 is the normal behavior since we stubbed it
    else throw new Error("Normal transaction behavior changed");

    console.log(`Passed: ${passed}/3 additional target tests`);
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await conn.end();
  }
}
runTests();
