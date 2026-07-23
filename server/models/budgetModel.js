const db = require('../config/db');

class BudgetModel {
  /**
   * Fetch budgets for a given year & month with calculated real-time usage from journal entries
   */
  static async getBudgets(year, month) {
    const query = `
      SELECT 
        b.id,
        b.account_id,
        acc.code AS account_code,
        acc.name AS account_name,
        acc.type AS account_type,
        b.period_month,
        b.period_year,
        b.allocated_amount,
        COALESCE(SUM(j.amount), 0) AS actual_used_amount
      FROM budgets b
      JOIN accounts acc ON b.account_id = acc.id
      LEFT JOIN journal_entries j ON j.account_id = acc.id AND j.entry_type = 'DEBIT'
      LEFT JOIN transactions t ON j.transaction_id = t.id 
        AND t.status = 'APPROVED'
        AND MONTH(t.date) = b.period_month 
        AND YEAR(t.date) = b.period_year
      WHERE b.period_year = ? AND (? IS NULL OR b.period_month = ?)
      GROUP BY b.id, b.account_id, acc.code, acc.name, acc.type, b.period_month, b.period_year, b.allocated_amount
      ORDER BY acc.code ASC
    `;
    const [rows] = await db.query(query, [year, month || null, month || null]);
    return rows;
  }

  /**
   * Upsert Budget Allocation
   */
  static async upsert(accountId, periodMonth, periodYear, allocatedAmount) {
    const query = `
      INSERT INTO budgets (account_id, period_month, period_year, allocated_amount)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE allocated_amount = VALUES(allocated_amount)
    `;
    await db.query(query, [accountId, periodMonth, periodYear, allocatedAmount]);
  }
}

module.exports = BudgetModel;
