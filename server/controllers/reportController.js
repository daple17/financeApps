const ReportService = require('../services/reportService');

class ReportController {
  static async getIncomeStatement(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const report = await ReportService.getIncomeStatement(startDate, endDate);
      res.status(200).json({
        status: 'success',
        message: 'Laporan Laba Rugi berhasil dikalkulasi',
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBalanceSheet(req, res, next) {
    try {
      const { asOfDate } = req.query;
      const report = await ReportService.getBalanceSheet(asOfDate);
      res.status(200).json({
        status: 'success',
        message: 'Laporan Neraca berhasil dikalkulasi',
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  static async getGeneralLedger(req, res, next) {
    try {
      const { accountId, startDate, endDate } = req.query;
      if (!accountId) {
        return res.status(400).json({
          status: 'error',
          message: 'Parameter accountId wajib disertakan'
        });
      }
      const report = await ReportService.getGeneralLedger(accountId, startDate, endDate);
      res.status(200).json({
        status: 'success',
        message: 'Laporan Buku Besar berhasil dikalkulasi',
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  static async getDashboardSummary(req, res, next) {
    try {
      const report = await ReportService.getDashboardSummary();
      res.status(200).json({
        status: 'success',
        message: 'Dashboard summary retrieved',
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReportController;
