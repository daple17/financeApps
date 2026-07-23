const ApprovalService = require('../services/approvalService');

class ApprovalController {
  static async getPending(req, res, next) {
    try {
      const result = await ApprovalService.getPendingApprovals(req.query);
      res.status(200).json({
        status: 'success',
        message: 'Daftar pengajuan transaksi pending approval berhasil dimuat',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  static async approve(req, res, next) {
    try {
      const transaction = await ApprovalService.approve(req.params.id, req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Pengajuan transaksi berhasil disetujui',
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }

  static async reject(req, res, next) {
    try {
      const { rejectionReason } = req.body;
      const transaction = await ApprovalService.reject(req.params.id, req.user.id, rejectionReason);
      res.status(200).json({
        status: 'success',
        message: 'Pengajuan transaksi telah ditolak',
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ApprovalController;
