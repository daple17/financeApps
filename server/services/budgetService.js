const BudgetModel = require('../models/budgetModel');
const CoaModel = require('../models/coaModel');
const UserModel = require('../models/userModel');

class BudgetService {
  static async getBudgets(year, month) {
    const periodYear = year ? parseInt(year) : new Date().getFullYear();
    const periodMonth = month ? parseInt(month) : null;

    const budgets = await BudgetModel.getBudgets(periodYear, periodMonth);
    
    // Calculate variance (Selisih Sisa Anggaran & % Pemakaian)
    return budgets.map(item => {
      const allocated = Number(item.allocated_amount);
      const used = Number(item.actual_used_amount);
      const remaining = allocated - used;
      const usagePercentage = allocated > 0 ? ((used / allocated) * 100).toFixed(2) : 0;

      return {
        ...item,
        allocated_amount: allocated,
        actual_used_amount: used,
        remaining_amount: remaining,
        usage_percentage: Number(usagePercentage)
      };
    });
  }

  static async setBudget(data, userId) {
    const { accountId, periodMonth, periodYear, allocatedAmount } = data;
    if (!accountId || !periodMonth || !periodYear || allocatedAmount === undefined || allocatedAmount < 0) {
      const error = new Error('Akun ID, bulan, tahun, dan alokasi anggaran wajib diisi');
      error.statusCode = 400;
      throw error;
    }

    const account = await CoaModel.findById(accountId);
    if (!account) {
      const error = new Error('Akun tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }

    await BudgetModel.upsert(accountId, periodMonth, periodYear, allocatedAmount);

    await UserModel.logAudit({
      userId,
      action: 'BUDGET_SET',
      entityType: 'BUDGET',
      entityId: accountId,
      details: { accountCode: account.code, periodMonth, periodYear, allocatedAmount }
    });

    return true;
  }
}

module.exports = BudgetService;
