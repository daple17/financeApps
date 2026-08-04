const TransactionModel = require('../models/transactionModel');
const CoaModel = require('../models/coaModel');
const UserModel = require('../models/userModel');

class TransactionService {
  /**
   * Create Transaction with Double-Entry Bookkeeping
   */
  static async createTransaction(data, userId, externalConnection = null, forceApproved = false, sourceData = null) {
    const { date, type, description, amount, journalEntries, attachmentUrl } = data;

    if (!date || !type || !description || !amount || !journalEntries || journalEntries.length < 2) {
      const error = new Error('Tanggal, tipe, deskripsi, nominal, dan minimal 2 entry jurnal (Debit & Kredit) wajib diisi');
      error.statusCode = 400;
      throw error;
    }

    // 1. Validate Double-Entry Balance (Total Debit === Total Credit)
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of journalEntries) {
      if (!entry.accountId || !entry.type || !entry.amount || entry.amount <= 0) {
        const error = new Error('Setiap rincian jurnal harus memiliki accountId, tipe (DEBIT/CREDIT), dan nominal > 0');
        error.statusCode = 400;
        throw error;
      }

      // Verify Account Exists
      const account = await CoaModel.findById(entry.accountId);
      if (!account) {
        const error = new Error(`Akun dengan ID ${entry.accountId} tidak ditemukan`);
        error.statusCode = 404;
        throw error;
      }

      if (entry.type === 'DEBIT') {
        totalDebit += Number(entry.amount);
      } else if (entry.type === 'CREDIT') {
        totalCredit += Number(entry.amount);
      }
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      const error = new Error(`Prinsip Double-Entry tidak seimbang! Total Debit (Rp ${totalDebit.toLocaleString('id-ID')}) tidak sama dengan Total Kredit (Rp ${totalCredit.toLocaleString('id-ID')})`);
      error.statusCode = 400;
      throw error;
    }

    // 2. Generate Unique Transaction Number (e.g. TRX-202607-4921)
    const dateObj = new Date(date);
    const yearMonth = dateObj.toISOString().slice(0, 7).replace('-', '');
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const transactionNumber = `TRX-${yearMonth}-${randomSeq}`;

    // 3. Approval Requirement Rules (Expenses >= Rp 5.000.000 require Manager Approval)
    const APPROVAL_THRESHOLD = 5000000;
    let status = 'APPROVED';
    if (forceApproved) {
      status = 'APPROVED';
    } else if (type === 'EXPENSE' && Number(amount) >= APPROVAL_THRESHOLD) {
      status = 'PENDING_APPROVAL';
    }

    const transactionData = {
      transactionNumber,
      date,
      type,
      description,
      amount: Number(amount),
      status,
      attachmentUrl,
      createdBy: userId,
      sourceType: sourceData?.sourceType || null,
      sourceId: sourceData?.sourceId || null,
      sourceNumber: sourceData?.sourceNumber || null,
      isSystemGenerated: sourceData ? true : false
    };

    const transactionId = await TransactionModel.createWithJournals(transactionData, journalEntries, externalConnection);

    // 4. Log Audit
    await UserModel.logAudit({
      userId,
      action: 'TRANSACTION_CREATE',
      entityType: 'TRANSACTION',
      entityId: transactionId,
      details: { transactionNumber, amount, status }
    }, externalConnection);

    // If we're inside a transaction, findById might not see uncommitted data if not on the same connection,
    // or it's fine since we are not returning it directly. We'll leave findById as is because it's just a SELECT.
    return transactionId;
  }

  static async getTransactions(filters) {
    return await TransactionModel.findAll(filters);
  }

  static async getTransactionById(id) {
    const transaction = await TransactionModel.findById(id);
    if (!transaction) {
      const error = new Error('Transaksi tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
    return transaction;
  }

  /**
   * Specifically handles Settlement Posting using the Finance Engine
   */
  static async postSettlement(payload, userId, externalConnection, sourceData) {
    if (!externalConnection) {
      throw new Error('TransactionService.postSettlement requires an external connection to ensure atomicity');
    }

    const { settlementId, transactionData } = payload;

    // Utilize existing Finance posting engine
    const transactionId = await TransactionService.createTransaction(transactionData, userId, externalConnection, true, sourceData);

    // Update settlement
    await externalConnection.query(
      `UPDATE settlements SET status = 'POSTED', transaction_id = ?, posted_by = ?, posted_at = NOW() WHERE id = ?`,
      [transactionId, userId, settlementId]
    );

    // Audit Log specific to settlement
    const UserModel = require('../models/userModel');
    await UserModel.logAudit({
      userId,
      action: 'SETTLEMENT_POSTED',
      entityType: 'SETTLEMENT',
      entityId: settlementId,
      details: { transactionId, journalCount: transactionData.journalEntries.length }
    }, externalConnection);

    return transactionId;
  }
}

module.exports = TransactionService;
