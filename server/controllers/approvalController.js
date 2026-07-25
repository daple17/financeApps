const ApprovalService = require('../services/approvalService');

class ApprovalController {
  static async getPending(req, res, next) {
    try {
      const result = await ApprovalService.getPendingApprovals(req.query);
      let payload = result;
      if (req.query.type === 'OPERATION_COST') {
        payload = { data: result }; // normalize response format
      }
      res.status(200).json({
        status: 'success',
        message: 'Daftar pengajuan pending approval berhasil dimuat',
        ...payload
      });
    } catch (error) {
      next(error);
    }
  }

  static async approve(req, res, next) {
    try {
      const type = req.query.type || 'TRANSACTION';
      const entity = await ApprovalService.approve(req.params.id, req.user.id, type);
      res.status(200).json({
        status: 'success',
        message: type === 'OPERATION_COST' ? 'Pengajuan biaya operasional berhasil disetujui' : 'Pengajuan transaksi berhasil disetujui',
        data: entity
      });
    } catch (error) {
      next(error);
    }
  }

  static async reject(req, res, next) {
    try {
      const { rejectionReason } = req.body;
      const type = req.query.type || 'TRANSACTION';
      const entity = await ApprovalService.reject(req.params.id, req.user.id, rejectionReason, type);
      res.status(200).json({
        status: 'success',
        message: type === 'OPERATION_COST' ? 'Pengajuan biaya operasional telah ditolak' : 'Pengajuan transaksi telah ditolak',
        data: entity
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ApprovalController;
