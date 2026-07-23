const BudgetService = require('../services/budgetService');

class BudgetController {
  static async getBudgets(req, res, next) {
    try {
      const { year, month } = req.query;
      const data = await BudgetService.getBudgets(year, month);
      res.status(200).json({
        status: 'success',
        message: 'Data alokasi dan pemantauan anggaran berhasil dimuat',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  static async setBudget(req, res, next) {
    try {
      await BudgetService.setBudget(req.body, req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Alokasi anggaran berhasil disimpan'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BudgetController;
