const db = require('../config/db');
const CashAdvanceModel = require('../models/cashAdvanceModel');
const CoaModel = require('../models/coaModel');
const TransactionService = require('./transactionService');
const UserModel = require('../models/userModel');

class CashAdvanceService {
  static async disburse(cashAdvanceId, payload, userId) {
    const { source_account_id, disbursement_date, notes } = payload;

    if (!source_account_id) {
      throw new Error('Source Account (Kas/Bank) wajib dipilih');
    }
    if (!disbursement_date) {
      throw new Error('Tanggal pencairan wajib diisi');
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Lock Cash Advance
      const [caRows] = await connection.query('SELECT * FROM cash_advances WHERE id = ? FOR UPDATE', [cashAdvanceId]);
      if (caRows.length === 0) {
        throw new Error('Cash Advance tidak ditemukan');
      }

      // Fetch enriched advance for descriptions
      const advanceEnriched = await CashAdvanceModel.findById(cashAdvanceId);

      const advance = caRows[0];
      if (advance.status !== 'APPROVED') {
        throw new Error(`Hanya Cash Advance berstatus APPROVED yang dapat dicairkan. Status saat ini: ${advance.status}`);
      }
      if (advance.transaction_id !== null) {
        throw new Error('Cash Advance ini sudah dicairkan sebelumnya');
      }
      if (advance.advance_scope === 'GENERAL') {
        throw new Error('Disbursement for GENERAL cash advances is currently not supported until the General Expense mechanism is implemented.');
      }

      // 2. Resolve Advance Account (1300 - Piutang Operasional)
      const advanceAccount = await CoaModel.findByCode('1300');
      if (!advanceAccount || advanceAccount.is_active !== 1 || advanceAccount.type !== 'ASSET') {
        throw new Error('Akun Piutang Operasional (1300) tidak valid atau tidak aktif');
      }

      // 3. Validate Source Account
      const sourceAccount = await CoaModel.findById(source_account_id);
      if (!sourceAccount) {
        throw new Error('Akun sumber tidak ditemukan');
      }
      if (sourceAccount.id === advanceAccount.id) {
        throw new Error('Akun sumber tidak boleh sama dengan akun tujuan (Piutang Operasional)');
      }
      if (sourceAccount.type !== 'ASSET') {
        throw new Error('Akun sumber harus berupa Aset (Kas / Bank)');
      }
      // Strict rule for Cash/Bank (11xx or 12xx)
      if (!sourceAccount.code.startsWith('11') && !sourceAccount.code.startsWith('12')) {
        throw new Error('Akun sumber tidak valid. Hanya akun Kas (11xx) atau Bank (12xx) yang diperbolehkan.');
      }
      if (sourceAccount.is_active !== 1) {
        throw new Error('Akun sumber sedang tidak aktif');
      }

      // 4. Generate Finance Transaction & Journals
      // Double entry: Dr Piutang Operasional, Cr Kas/Bank
      const journalEntries = [
        {
          accountId: advanceAccount.id,
          type: 'DEBIT',
          amount: advance.amount
        },
        {
          accountId: sourceAccount.id,
          type: 'CREDIT',
          amount: advance.amount
        }
      ];

      const recipient = advanceEnriched.driver_name || advanceEnriched.user_name || '-';
      const reference = advanceEnriched.job_order_number || advanceEnriched.operation_no || advanceEnriched.advance_scope;
      
      const stdDescription = `Cash Advance Disbursement ${advance.advance_no}\nRecipient: ${recipient}\nOperation/Job Order: ${reference}`;
      const description = notes ? `${stdDescription}\nNotes: ${notes}` : stdDescription;
      
      const transactionData = {
        date: disbursement_date,
        type: 'TRANSFER', // Asset to Asset movement
        description: description,
        amount: advance.amount,
        journalEntries,
        attachmentUrl: null
      };

      const sourceData = {
        sourceType: 'CASH_ADVANCE_DISBURSEMENT',
        sourceId: cashAdvanceId,
        sourceNumber: advance.advance_no
      };

      const transactionId = await TransactionService.createTransaction(transactionData, userId, connection, true, sourceData);

      // 5. Update Cash Advance
      const updateQuery = `
        UPDATE cash_advances 
        SET status = 'DISBURSED', 
            transaction_id = ?, 
            disbursed_by = ?, 
            disbursed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      await connection.query(updateQuery, [transactionId, userId, cashAdvanceId]);

      // 6. Audit Log
      await UserModel.logAudit({
        userId,
        action: 'CASH_ADVANCE_DISBURSED',
        entityType: 'CASH_ADVANCE',
        entityId: cashAdvanceId,
        details: { advance_no: advance.advance_no, transaction_id: transactionId, disbursement_date }
      }, connection);

      await connection.commit();
      
      return { success: true, transactionId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = CashAdvanceService;
