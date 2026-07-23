const TransactionService = require('../services/transactionService');
const CoaModel = require('../models/coaModel');
const db = require('../config/database');

async function runTests() {
  console.log('=== Memulai Verifikasi Sistem Backend ===\n');
  let passed = 0;
  let failed = 0;

  try {
    // 1. Verifikasi Double-Entry: Balance
    console.log('[Test 1] Verifikasi Double-Entry (Balance Tepat)');
    const account1 = await db.query('SELECT id FROM coa LIMIT 1').then(res => res[0][0]);
    const account2 = await db.query('SELECT id FROM coa LIMIT 1 OFFSET 1').then(res => res[0][0]);

    if (!account1 || !account2) {
       console.log('❌ Gagal: Tidak ada cukup akun COA untuk ditest.');
       failed++;
       return;
    }

    try {
      await TransactionService.createTransaction({
        date: new Date().toISOString().slice(0, 10),
        type: 'JOURNAL',
        description: 'Test Jurnal Seimbang',
        amount: 100000,
        journalEntries: [
          { accountId: account1.id, type: 'DEBIT', amount: 100000 },
          { accountId: account2.id, type: 'CREDIT', amount: 100000 }
        ]
      }, 1); // Mock userId 1
      console.log('✅ Passed: Jurnal seimbang berhasil disimpan.\n');
      passed++;
    } catch (e) {
      console.log(`❌ Failed: Seharusnya berhasil, tapi error: ${e.message}\n`);
      failed++;
    }

    // 2. Verifikasi Double-Entry: Tidak Seimbang
    console.log('[Test 2] Verifikasi Double-Entry (Tidak Seimbang)');
    try {
      await TransactionService.createTransaction({
        date: new Date().toISOString().slice(0, 10),
        type: 'JOURNAL',
        description: 'Test Jurnal Tidak Seimbang',
        amount: 100000,
        journalEntries: [
          { accountId: account1.id, type: 'DEBIT', amount: 100000 },
          { accountId: account2.id, type: 'CREDIT', amount: 99000 } // Selisih 1000
        ]
      }, 1);
      console.log('❌ Failed: Jurnal tidak seimbang DIBIARKAN tersimpan!\n');
      failed++;
    } catch (e) {
      if (e.message.includes('Double-Entry tidak seimbang')) {
        console.log('✅ Passed: Jurnal tidak seimbang berhasil DITOLAK oleh sistem.\n');
        passed++;
      } else {
        console.log(`❌ Failed dengan error yang salah: ${e.message}\n`);
        failed++;
      }
    }

    // 3. Verifikasi Error Handling Parameter Kosong
    console.log('[Test 3] Verifikasi Validasi Parameter');
    try {
       await TransactionService.createTransaction({
        date: new Date().toISOString().slice(0, 10),
        type: 'JOURNAL',
        // missing description and amount
        journalEntries: []
       }, 1);
       console.log('❌ Failed: Parameter kosong lolos validasi.\n');
       failed++;
    } catch(e) {
       console.log('✅ Passed: Parameter kosong ditolak dengan baik.\n');
       passed++;
    }

  } catch (error) {
    console.error('Kesalahan fatal saat testing:', error);
  } finally {
    console.log('=== Hasil Verifikasi ===');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
