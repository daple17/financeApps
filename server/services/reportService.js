const db = require('../config/db');

class ReportService {
  /**
   * Laporan Laba Rugi (Income Statement)
   * @param {string} startDate 
   * @param {string} endDate 
   */
  static async getIncomeStatement(startDate, endDate) {
    const query = `
      SELECT 
        acc.id,
        acc.code,
        acc.name,
        acc.type,
        acc.category,
        COALESCE(SUM(CASE WHEN acc.type = 'REVENUE' THEN (
          CASE WHEN j.entry_type = 'CREDIT' THEN j.amount ELSE -j.amount END
        ) ELSE (
          CASE WHEN j.entry_type = 'DEBIT' THEN j.amount ELSE -j.amount END
        ) END), 0) AS total_amount
      FROM accounts acc
      LEFT JOIN journal_entries j ON acc.id = j.account_id
      LEFT JOIN transactions t ON j.transaction_id = t.id 
        AND t.status = 'APPROVED'
        AND (? IS NULL OR t.date >= ?)
        AND (? IS NULL OR t.date <= ?)
      WHERE acc.type IN ('REVENUE', 'EXPENSE')
      GROUP BY acc.id, acc.code, acc.name, acc.type, acc.category
      ORDER BY acc.code ASC
    `;

    const [rows] = await db.query(query, [
      startDate || null, startDate || null,
      endDate || null, endDate || null
    ]);

    const revenues = rows.filter(r => r.type === 'REVENUE');
    const expenses = rows.filter(r => r.type === 'EXPENSE');

    const totalRevenue = revenues.reduce((sum, r) => sum + Number(r.total_amount), 0);
    const totalExpense = expenses.reduce((sum, r) => sum + Number(r.total_amount), 0);
    const netIncome = totalRevenue - totalExpense;

    return {
      period: { startDate: startDate || 'Awal', endDate: endDate || 'Sekarang' },
      revenues,
      expenses,
      summary: {
        totalRevenue,
        totalExpense,
        netIncome,
        status: netIncome >= 0 ? 'SURPLUS / LABA' : 'DEFISIT / RUGI'
      }
    };
  }

  /**
   * Laporan Neraca (Balance Sheet)
   * @param {string} asOfDate 
   */
  static async getBalanceSheet(asOfDate) {
    const query = `
      SELECT 
        acc.id,
        acc.code,
        acc.name,
        acc.type,
        acc.category,
        COALESCE(SUM(
          CASE 
            WHEN acc.type = 'ASSET' THEN (CASE WHEN j.entry_type = 'DEBIT' THEN j.amount ELSE -j.amount END)
            WHEN acc.type IN ('LIABILITY', 'EQUITY') THEN (CASE WHEN j.entry_type = 'CREDIT' THEN j.amount ELSE -j.amount END)
            ELSE 0
          END
        ), 0) AS balance
      FROM accounts acc
      LEFT JOIN journal_entries j ON acc.id = j.account_id
      LEFT JOIN transactions t ON j.transaction_id = t.id 
        AND t.status = 'APPROVED'
        AND (? IS NULL OR t.date <= ?)
      WHERE acc.type IN ('ASSET', 'LIABILITY', 'EQUITY')
      GROUP BY acc.id, acc.code, acc.name, acc.type, acc.category
      ORDER BY acc.code ASC
    `;

    const [rows] = await db.query(query, [asOfDate || null, asOfDate || null]);

    // Also calculate Net Income to append to Retained Earnings in Equity
    const incomeStmt = await this.getIncomeStatement(null, asOfDate);
    const currentNetIncome = incomeStmt.summary.netIncome;

    const assets = rows.filter(r => r.type === 'ASSET');
    const liabilities = rows.filter(r => r.type === 'LIABILITY');
    const equities = rows.filter(r => r.type === 'EQUITY');

    const totalAssets = assets.reduce((sum, r) => sum + Number(r.balance), 0);
    const totalLiabilities = liabilities.reduce((sum, r) => sum + Number(r.balance), 0);
    const totalEquityWithoutIncome = equities.reduce((sum, r) => sum + Number(r.balance), 0);
    const totalEquity = totalEquityWithoutIncome + currentNetIncome;

    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    return {
      asOfDate: asOfDate || 'Hari ini',
      assets,
      liabilities,
      equities,
      currentNetIncome,
      summary: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
        isBalanced
      }
    };
  }

  /**
   * Buku Besar (General Ledger)
   * @param {number} accountId 
   * @param {string} startDate 
   * @param {string} endDate 
   */
  static async getGeneralLedger(accountId, startDate, endDate) {
    const query = `
      SELECT 
        t.date,
        t.transaction_number,
        t.description,
        j.entry_type,
        j.amount,
        acc.code AS account_code,
        acc.name AS account_name,
        acc.type AS account_type
      FROM journal_entries j
      JOIN transactions t ON j.transaction_id = t.id
      JOIN accounts acc ON j.account_id = acc.id
      WHERE j.account_id = ?
        AND t.status = 'APPROVED'
        AND (? IS NULL OR t.date >= ?)
        AND (? IS NULL OR t.date <= ?)
      ORDER BY t.date ASC, t.id ASC
    `;

    const [rows] = await db.query(query, [
      accountId,
      startDate || null, startDate || null,
      endDate || null, endDate || null
    ]);

    let runningBalance = 0;
    const entries = rows.map(r => {
      const isAssetOrExpense = ['ASSET', 'EXPENSE'].includes(r.account_type);
      const debitAmount = r.entry_type === 'DEBIT' ? Number(r.amount) : 0;
      const creditAmount = r.entry_type === 'CREDIT' ? Number(r.amount) : 0;

      if (isAssetOrExpense) {
        runningBalance += (debitAmount - creditAmount);
      } else {
        runningBalance += (creditAmount - debitAmount);
      }

      return {
        ...r,
        debit: debitAmount,
        credit: creditAmount,
        running_balance: runningBalance
      };
    });

    return {
      accountId,
      period: { startDate, endDate },
      entries,
      finalBalance: runningBalance
    };
  }
  static async getDashboardSummary() {
    const [kasRows] = await db.query(`
      SELECT COALESCE(SUM(CASE WHEN j.entry_type = 'DEBIT' THEN j.amount ELSE -j.amount END), 0) AS total_kas
      FROM accounts acc
      JOIN journal_entries j ON acc.id = j.account_id
      JOIN transactions t ON j.transaction_id = t.id
      WHERE acc.type = 'ASSET' AND acc.category = 'Lancar' AND t.status = 'APPROVED'
    `);
    
    const [incomeRows] = await db.query(`
      SELECT COALESCE(SUM(CASE WHEN j.entry_type = 'CREDIT' THEN j.amount ELSE -j.amount END), 0) AS pendapatan_bulan_ini
      FROM accounts acc
      JOIN journal_entries j ON acc.id = j.account_id
      JOIN transactions t ON j.transaction_id = t.id
      WHERE acc.type = 'REVENUE' AND t.status = 'APPROVED' 
        AND MONTH(t.date) = MONTH(CURRENT_DATE()) AND YEAR(t.date) = YEAR(CURRENT_DATE())
    `);
    
    const [pendingRows] = await db.query(`
      SELECT COUNT(*) AS pending_approvals
      FROM transactions
      WHERE status = 'PENDING_APPROVAL'
    `);
    
    const [budgetRows] = await db.query(`
      SELECT COALESCE(SUM(used_amount), 0) AS total_used, COALESCE(SUM(allocated_amount), 0) AS total_allocated
      FROM budgets
      WHERE period_month = MONTH(CURRENT_DATE()) AND period_year = YEAR(CURRENT_DATE())
    `);
    
    let budgetUsagePercentage = 0;
    if (budgetRows[0].total_allocated > 0) {
      budgetUsagePercentage = (budgetRows[0].total_used / budgetRows[0].total_allocated) * 100;
    }
    
    return {
      totalKasBank: Number(kasRows[0].total_kas) || 0,
      pendapatanBulanIni: Number(incomeRows[0].pendapatan_bulan_ini) || 0,
      pendingApprovals: Number(pendingRows[0].pending_approvals) || 0,
      penggunaanAnggaran: Number(budgetUsagePercentage.toFixed(2)) || 0
    };
  }
}

module.exports = ReportService;
