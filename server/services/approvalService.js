const TransactionModel = require('../models/transactionModel');
const OperationCostModel = require('../models/operationCostModel');
const UserModel = require('../models/userModel');

class ApprovalService {
  static async getPendingApprovals(filters) {
    if (filters.type === 'OPERATION_COST') {
      return await OperationCostModel.getPendingApprovals();
    }
    return await TransactionModel.findAll({ ...filters, status: 'PENDING_APPROVAL' });
  }

  static async approve(entityId, userId, entityType = 'TRANSACTION') {
    if (entityType === 'OPERATION_COST') {
      const operationCost = await OperationCostModel.findById(entityId);
      if (!operationCost) {
        const error = new Error('Biaya operasional tidak ditemukan');
        error.statusCode = 404;
        throw error;
      }

      if (operationCost.status !== 'SUBMITTED') {
        const error = new Error(`Cost status is ${operationCost.status}, not SUBMITTED`);
        error.statusCode = 400;
        throw error;
      }

      if (operationCost.created_by === userId) {
        const error = new Error('Pemisahan tugas: Anda tidak dapat menyetujui biaya operasional yang Anda buat sendiri');
        error.statusCode = 403;
        throw error;
      }

      const success = await OperationCostModel.updateStatus(entityId, 'APPROVED', userId, 'SUBMITTED');
      if (!success) {
        const error = new Error('Gagal menyetujui, record mungkin telah diubah oleh orang lain');
        error.statusCode = 409;
        throw error;
      }

      await UserModel.logAudit({
        userId,
        action: 'OPERATION_COST_APPROVED',
        entityType: 'OPERATION_COST',
        entityId: entityId,
        details: { reference_no: operationCost.reference_no }
      });

      return await OperationCostModel.findById(entityId);
    }

    // Default Transaction logic
    const transaction = await TransactionModel.findById(entityId);
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

    await TransactionModel.updateStatus(entityId, 'APPROVED', userId, null);

    await UserModel.logAudit({
      userId,
      action: 'APPROVAL_APPROVE',
      entityType: 'TRANSACTION',
      entityId: entityId,
      details: { transactionNumber: transaction.transaction_number }
    });

    return await TransactionModel.findById(entityId);
  }

  static async reject(entityId, userId, rejectionReason, entityType = 'TRANSACTION') {
    if (!rejectionReason) {
      const error = new Error('Alasan penolakan pengajuan wajib diisi');
      error.statusCode = 400;
      throw error;
    }

    if (entityType === 'OPERATION_COST') {
      const operationCost = await OperationCostModel.findById(entityId);
      if (!operationCost) {
        const error = new Error('Biaya operasional tidak ditemukan');
        error.statusCode = 404;
        throw error;
      }

      if (operationCost.status !== 'SUBMITTED') {
        const error = new Error(`Cost status is ${operationCost.status}, not SUBMITTED`);
        error.statusCode = 400;
        throw error;
      }

      if (operationCost.created_by === userId) {
        const error = new Error('Pemisahan tugas: Anda tidak dapat menolak biaya operasional yang Anda buat sendiri');
        error.statusCode = 403;
        throw error;
      }

      const success = await OperationCostModel.updateStatus(entityId, 'REJECTED', userId, 'SUBMITTED', rejectionReason);
      if (!success) {
        const error = new Error('Gagal menolak, record mungkin telah diubah oleh orang lain');
        error.statusCode = 409;
        throw error;
      }

      await UserModel.logAudit({
        userId,
        action: 'OPERATION_COST_REJECTED',
        entityType: 'OPERATION_COST',
        entityId: entityId,
        details: { reference_no: operationCost.reference_no, rejectionReason }
      });

      return await OperationCostModel.findById(entityId);
    }

    // Default Transaction logic
    const transaction = await TransactionModel.findById(entityId);
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

    await TransactionModel.updateStatus(entityId, 'REJECTED', userId, rejectionReason);

    await UserModel.logAudit({
      userId,
      action: 'APPROVAL_REJECT',
      entityType: 'TRANSACTION',
      entityId: entityId,
      details: { transactionNumber: transaction.transaction_number, rejectionReason }
    });

    return await TransactionModel.findById(entityId);
  }
}

module.exports = ApprovalService;
