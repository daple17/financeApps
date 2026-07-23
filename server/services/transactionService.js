const TransactionModel = require('../models/transactionModel');
const CoaModel = require('../models/coaModel');
const UserModel = require('../models/userModel');

class TransactionService {
  /**
   * Create Transaction with Double-Entry Bookkeeping
   */
  static async createTransaction(data, userId) {
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
    if (type === 'EXPENSE' && Number(amount) >= APPROVAL_THRESHOLD) {
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
      createdBy: userId
    };

    const transactionId = await TransactionModel.createWithJournals(transactionData, journalEntries);

    // 4. Log Audit
    await UserModel.logAudit({
      userId,
      action: 'TRANSACTION_CREATE',
      entityType: 'TRANSACTION',
      entityId: transactionId,
      details: { transactionNumber, amount, status }
    });

    return await TransactionModel.findById(transactionId);
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
}

module.exports = TransactionService;
