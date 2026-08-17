const TransactionModel = require('../models/transactionModel');
const OperationCostModel = require('../models/operationCostModel');
const CashAdvanceModel = require('../models/cashAdvanceModel');
const UserModel = require('../models/userModel');
const SettlementModel = require('../models/settlementModel');
const SettlementService = require('./settlementService');
const VendorInvoiceModel = require('../models/vendorInvoiceModel');
const VendorInvoiceService = require('./vendorInvoiceService');

class ApprovalService {
  static async getPendingApprovals(filters) {
    if (filters.type === 'OPERATION_COST') {
      return await OperationCostModel.getPendingApprovals();
    }
    if (filters.type === 'CASH_ADVANCE') {
      return await CashAdvanceModel.findAll({ status: 'SUBMITTED' });
    }
    if (filters.type === 'SETTLEMENT') {
      return await SettlementModel.findAll({ status: 'SUBMITTED' });
    }
    if (filters.type === 'VENDOR_INVOICE') {
      return await VendorInvoiceModel.getPendingApprovals();
    }
    return await TransactionModel.findAll({ ...filters, status: 'PENDING_APPROVAL' });
  }

  static async approve(entityId, userId, entityType = 'TRANSACTION') {
    if (entityType === 'SETTLEMENT') {
      await SettlementService.approve(entityId, userId);
      await UserModel.logAudit({
        userId,
        action: 'SETTLEMENT_APPROVED',
        entityType: 'SETTLEMENT',
        entityId: entityId,
        details: { settlement_id: entityId }
      });
      return await SettlementModel.findById(entityId);
    }

    if (entityType === 'CASH_ADVANCE') {
      const advance = await CashAdvanceModel.findById(entityId);
      if (!advance) {
        const error = new Error('Cash Advance tidak ditemukan');
        error.statusCode = 404;
        throw error;
      }
      if (advance.status !== 'SUBMITTED') {
        const error = new Error(`Status Cash Advance adalah ${advance.status}, bukan SUBMITTED`);
        error.statusCode = 400;
        throw error;
      }
      if (advance.created_by === userId) {
        const error = new Error('Pemisahan tugas: Anda tidak dapat menyetujui pengajuan yang Anda buat sendiri');
        error.statusCode = 403;
        throw error;
      }
      
      const success = await CashAdvanceModel.approve(entityId, userId);
      if (!success) {
        const error = new Error('Gagal menyetujui Cash Advance');
        error.statusCode = 409;
        throw error;
      }
      
      await UserModel.logAudit({
        userId,
        action: 'CASH_ADVANCE_APPROVED',
        entityType: 'CASH_ADVANCE',
        entityId: entityId,
        details: { advance_no: advance.advance_no }
      });
      return await CashAdvanceModel.findById(entityId);
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

    if (entityType === 'VENDOR_INVOICE') {
      await VendorInvoiceService.approve(entityId, userId);
      return await VendorInvoiceModel.findById(entityId);
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

    if (entityType === 'SETTLEMENT') {
      await SettlementService.reject(entityId, userId, rejectionReason);
      await UserModel.logAudit({
        userId,
        action: 'SETTLEMENT_REJECTED',
        entityType: 'SETTLEMENT',
        entityId: entityId,
        details: { settlement_id: entityId, reason: rejectionReason }
      });
      return await SettlementModel.findById(entityId);
    }

    if (entityType === 'CASH_ADVANCE') {
      const advance = await CashAdvanceModel.findById(entityId);
      if (!advance) {
        const error = new Error('Cash Advance tidak ditemukan');
        error.statusCode = 404;
        throw error;
      }
      if (advance.status !== 'SUBMITTED') {
        const error = new Error(`Status Cash Advance adalah ${advance.status}, bukan SUBMITTED`);
        error.statusCode = 400;
        throw error;
      }
      if (advance.created_by === userId) {
        const error = new Error('Pemisahan tugas: Anda tidak dapat menolak pengajuan yang Anda buat sendiri');
        error.statusCode = 403;
        throw error;
      }
      
      const success = await CashAdvanceModel.reject(entityId, userId, rejectionReason);
      if (!success) {
        const error = new Error('Gagal menolak Cash Advance');
        error.statusCode = 409;
        throw error;
      }
      
      await UserModel.logAudit({
        userId,
        action: 'CASH_ADVANCE_REJECTED',
        entityType: 'CASH_ADVANCE',
        entityId: entityId,
        details: { advance_no: advance.advance_no, rejectionReason }
      });
      return await CashAdvanceModel.findById(entityId);
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

    if (entityType === 'VENDOR_INVOICE') {
      await VendorInvoiceService.reject(entityId, userId, rejectionReason);
      return await VendorInvoiceModel.findById(entityId);
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
