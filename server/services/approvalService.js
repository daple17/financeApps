const TransactionModel = require('../models/transactionModel');
const UserModel = require('../models/userModel');

class ApprovalService {
  static async getPendingApprovals(filters) {
    return await TransactionModel.findAll({ ...filters, status: 'PENDING_APPROVAL' });
  }

  static async approve(transactionId, userId) {
    const transaction = await TransactionModel.findById(transactionId);
    if (!transaction) {
      const error = new Error('Transaksi tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }

    if (transaction.status !== 'PENDING_APPROVAL') {
      const error = new Error(`Transaksi statusnya adalah ${transaction.status}, bukan PENDING_APPROVAL`);
      error.statusCode = 400;
      throw error;
    }

    await TransactionModel.updateStatus(transactionId, 'APPROVED', userId, null);

    await UserModel.logAudit({
      userId,
      action: 'APPROVAL_APPROVE',
      entityType: 'TRANSACTION',
      entityId: transactionId,
      details: { transactionNumber: transaction.transaction_number }
    });

    return await TransactionModel.findById(transactionId);
  }

  static async reject(transactionId, userId, rejectionReason) {
    if (!rejectionReason) {
      const error = new Error('Alasan penolakan pengajuan wajib diisi');
      error.statusCode = 400;
      throw error;
    }

    const transaction = await TransactionModel.findById(transactionId);
    if (!transaction) {
      const error = new Error('Transaksi tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }

    if (transaction.status !== 'PENDING_APPROVAL') {
      const error = new Error(`Transaksi statusnya adalah ${transaction.status}, bukan PENDING_APPROVAL`);
      error.statusCode = 400;
      throw error;
    }

    await TransactionModel.updateStatus(transactionId, 'REJECTED', userId, rejectionReason);

    await UserModel.logAudit({
      userId,
      action: 'APPROVAL_REJECT',
      entityType: 'TRANSACTION',
      entityId: transactionId,
      details: { transactionNumber: transaction.transaction_number, rejectionReason }
    });

    return await TransactionModel.findById(transactionId);
  }
}

module.exports = ApprovalService;
