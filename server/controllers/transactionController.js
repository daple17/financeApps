const TransactionService = require('../services/transactionService');

class TransactionController {
  static async create(req, res, next) {
    try {
      const transaction = await TransactionService.createTransaction(req.body, req.user.id);
      res.status(201).json({
        status: 'success',
        message: transaction.status === 'PENDING_APPROVAL' 
          ? 'Transaksi berhasil dibuat dan membutuhkan persetujuan Manajer Keuangan (Approval Pending)' 
          : 'Transaksi berhasil dibuat dan dicatat dalam jurnal umum',
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const result = await TransactionService.getTransactions(req.query);
      res.status(200).json({
        status: 'success',
        message: 'Daftar transaksi berhasil dimuat',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const transaction = await TransactionService.getTransactionById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }
  static async update(req, res, next) {
    try {
      const transaction = await TransactionService.getTransactionById(req.params.id);
      if (transaction && transaction.source_type) {
        return res.status(409).json({ status: 'error', message: 'System-generated transactions cannot be updated manually' });
      }
      res.status(501).json({ status: 'error', message: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const transaction = await TransactionService.getTransactionById(req.params.id);
      if (transaction && transaction.source_type) {
        return res.status(409).json({ status: 'error', message: 'System-generated transactions cannot be deleted manually' });
      }
      res.status(501).json({ status: 'error', message: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TransactionController;
