const db = require('../config/db');
const SettlementModel = require('../models/settlementModel');
const CostTypeMappingModel = require('../models/costTypeMappingModel');
const TransactionService = require('./transactionService');
const SystemAccountMappingModel = require('../models/systemAccountMappingModel');
const CoaModel = require('../models/coaModel');
const DecimalHelper = require('../utils/decimalHelper');

class SettlementService {
  static async createDraft(cashAdvanceId, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Lock Cash Advance
      const [caRows] = await connection.query('SELECT * FROM cash_advances WHERE id = ? FOR UPDATE', [cashAdvanceId]);
      if (caRows.length === 0) {
        throw new Error('Cash Advance tidak ditemukan');
      }
      
      const advance = caRows[0];
      if (advance.status !== 'DISBURSED') {
        throw new Error('Hanya Cash Advance berstatus DISBURSED yang dapat diselesaikan (Settlement)');
      }
      if (advance.transaction_id === null) {
        throw new Error('Cash Advance belum memiliki ID Transaksi (belum tercatat di Jurnal Finance)');
      }
      if (advance.advance_scope === 'GENERAL') {
        throw new Error('GENERAL Cash Advance settlement is not supported in this module');
      }

      // Check if settlement already exists
      const existing = await SettlementModel.findByCashAdvanceId(cashAdvanceId, connection);
      if (existing) {
        throw new Error('Conflict: Cash Advance ini sudah memiliki Settlement');
      }

      const settlement_no = await SettlementModel.generateSequenceNumber(connection);
      
      const settlementData = {
        settlement_no,
        cash_advance_id: cashAdvanceId,
        total_advance: advance.amount, // Snapshot from CA
        settlement_date: new Date(),
        created_by: userId
      };

      try {
        const insertId = await SettlementModel.create(settlementData, connection);
        await connection.commit();
        return insertId;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          throw new Error('Conflict: Cash Advance ini sudah memiliki Settlement (Concurrent request)');
        }
        throw err;
      }
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async addItem(settlementId, operationCostId, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Lock settlement
      const [stlRows] = await connection.query('SELECT * FROM settlements WHERE id = ? FOR UPDATE', [settlementId]);
      if (stlRows.length === 0) {
        throw new Error('Settlement tidak ditemukan');
      }
      const settlement = stlRows[0];
      if (settlement.status !== 'DRAFT') {
        throw new Error('Item hanya dapat ditambahkan pada Settlement berstatus DRAFT');
      }

      // Lock operation cost
      const [ocRows] = await connection.query('SELECT * FROM operation_costs WHERE id = ? FOR UPDATE', [operationCostId]);
      if (ocRows.length === 0) {
        throw new Error('Operation Cost tidak ditemukan');
      }
      const cost = ocRows[0];
      
      if (cost.status !== 'APPROVED') {
        throw new Error('Hanya Operation Cost berstatus APPROVED yang dapat dimasukkan ke Settlement');
      }
      if (cost.vendor_id !== null) {
        throw new Error('Operation Cost dari Vendor tidak dapat diselesaikan melalui Cash Advance Settlement (Gunakan Accounts Payable)');
      }

      // Lock cash advance to check context
      const [caRows] = await connection.query('SELECT * FROM cash_advances WHERE id = ?', [settlement.cash_advance_id]);
      const advance = caRows[0];

      if (advance.advance_scope === 'OPERATION' && cost.operation_id !== advance.operation_id) {
        throw new Error('Operation Cost tidak berasal dari Operation yang sama dengan Cash Advance');
      }
      if (advance.advance_scope === 'JOB_ORDER' && cost.job_order_id !== advance.job_order_id) {
        throw new Error('Operation Cost tidak berasal dari Job Order yang sama dengan Cash Advance');
      }

      // Check if item already in settlement
      const existingItem = await SettlementModel.getItemByOperationCostId(operationCostId, connection);
      if (existingItem) {
        throw new Error('Conflict: Operation Cost ini sudah dimasukkan ke dalam suatu Settlement');
      }

      try {
        await SettlementModel.addItem({
          settlement_id: settlementId,
          operation_cost_id: operationCostId,
          settled_amount: cost.amount // Server-side population
        }, connection);

        // Recalculate totals
        await this._recalculateTotals(settlementId, connection);

        await connection.commit();
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          throw new Error('Conflict: Operation Cost ini sudah dimasukkan (Concurrent request)');
        }
        throw err;
      }
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async removeItem(settlementId, itemId, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [stlRows] = await connection.query('SELECT * FROM settlements WHERE id = ? FOR UPDATE', [settlementId]);
      if (stlRows.length === 0) throw new Error('Settlement tidak ditemukan');
      if (stlRows[0].status !== 'DRAFT') throw new Error('Item hanya dapat dihapus dari Settlement berstatus DRAFT');

      const affected = await SettlementModel.removeItem(itemId, settlementId, connection);
      if (affected > 0) {
        await this._recalculateTotals(settlementId, connection);
      }

      await connection.commit();
      return affected;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async submit(settlementId, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Lock settlement
      const [stlRows] = await connection.query('SELECT * FROM settlements WHERE id = ? FOR UPDATE', [settlementId]);
      if (stlRows.length === 0) throw new Error('Settlement tidak ditemukan');
      
      const settlement = stlRows[0];
      if (settlement.status !== 'DRAFT') {
        throw new Error('Hanya Settlement berstatus DRAFT yang dapat disubmit');
      }

      // Lock Cash Advance
      const [caRows] = await connection.query('SELECT * FROM cash_advances WHERE id = ? FOR UPDATE', [settlement.cash_advance_id]);
      const advance = caRows[0];

      if (advance.status !== 'DISBURSED') {
        throw new Error('Cash Advance tidak lagi berstatus DISBURSED');
      }
      if (advance.transaction_id === null) {
        throw new Error('Cash Advance kehilangan ID Transaksi');
      }

      // Revalidate Items
      const items = await SettlementModel.getItems(settlementId, connection);
      if (items.length === 0) {
        throw new Error('Settlement harus memiliki minimal satu Operation Cost');
      }

      let totalExpense = 0;

      // Fetch active mappings cache
      const mappings = await CostTypeMappingModel.getAll();
      const activeMappings = new Map();
      mappings.forEach(m => {
        if (m.is_active) activeMappings.set(m.cost_type, m);
      });

      for (const item of items) {
        // Lock operation cost
        const [ocRows] = await connection.query('SELECT * FROM operation_costs WHERE id = ? FOR UPDATE', [item.operation_cost_id]);
        const cost = ocRows[0];

        if (cost.status !== 'APPROVED') {
          throw new Error(`Operation Cost (ID: ${cost.id}) tidak lagi APPROVED`);
        }
        if (cost.vendor_id !== null) {
          throw new Error(`Operation Cost (ID: ${cost.id}) dimiliki Vendor. Tidak dapat di-settle di sini.`);
        }
        if (advance.advance_scope === 'OPERATION' && cost.operation_id !== advance.operation_id) {
          throw new Error(`Operation Cost (ID: ${cost.id}) berbeda konteks Operation.`);
        }
        if (advance.advance_scope === 'JOB_ORDER' && cost.job_order_id !== advance.job_order_id) {
          throw new Error(`Operation Cost (ID: ${cost.id}) berbeda konteks Job Order.`);
        }

        if (!activeMappings.has(cost.cost_type)) {
          throw new Error(`Settlement cannot be submitted because ${cost.cost_type} does not have an active Expense Account mapping.`);
        }

        totalExpense += parseFloat(cost.amount);
      }

      const totalAdvance = parseFloat(settlement.total_advance);
      const difference = totalAdvance - totalExpense;

      // Update settlement status & amounts
      await SettlementModel.update(settlementId, {
        total_expense: totalExpense,
        difference: difference,
        status: 'SUBMITTED',
        submitted_by: userId,
        submitted_at: new Date()
      }, connection);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async approve(settlementId, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Lock settlement
      const [stlRows] = await connection.query('SELECT * FROM settlements WHERE id = ? FOR UPDATE', [settlementId]);
      if (stlRows.length === 0) throw new Error('Settlement tidak ditemukan');
      
      const settlement = stlRows[0];
      if (settlement.status !== 'SUBMITTED') {
        throw new Error('Hanya Settlement berstatus SUBMITTED yang dapat disetujui');
      }
      
      // SoD Check
      if (settlement.created_by === userId || settlement.submitted_by === userId) {
        throw new Error('Pemisahan tugas: Anda tidak dapat menyetujui Settlement yang Anda buat atau submit sendiri');
      }

      // Lock Cash Advance
      const [caRows] = await connection.query('SELECT * FROM cash_advances WHERE id = ? FOR UPDATE', [settlement.cash_advance_id]);
      const advance = caRows[0];

      if (advance.status !== 'DISBURSED') {
        throw new Error('Cash Advance tidak lagi berstatus DISBURSED');
      }
      if (advance.transaction_id === null) {
        throw new Error('Cash Advance kehilangan ID Transaksi');
      }

      // Revalidate Items
      const items = await SettlementModel.getItems(settlementId, connection);
      if (items.length === 0) {
        throw new Error('Settlement harus memiliki minimal satu Operation Cost');
      }

      let totalExpense = 0;

      // Fetch active mappings cache
      const mappings = await CostTypeMappingModel.getAll();
      const activeMappings = new Map();
      mappings.forEach(m => {
        if (m.is_active) activeMappings.set(m.cost_type, m);
      });

      for (const item of items) {
        // Lock operation cost
        const [ocRows] = await connection.query('SELECT * FROM operation_costs WHERE id = ? FOR UPDATE', [item.operation_cost_id]);
        const cost = ocRows[0];

        if (cost.status !== 'APPROVED') {
          throw new Error(`Operation Cost (ID: ${cost.id}) tidak lagi APPROVED`);
        }
        if (cost.vendor_id !== null) {
          throw new Error(`Operation Cost (ID: ${cost.id}) dimiliki Vendor. Tidak dapat di-settle di sini.`);
        }
        if (advance.advance_scope === 'OPERATION' && cost.operation_id !== advance.operation_id) {
          throw new Error(`Operation Cost (ID: ${cost.id}) berbeda konteks Operation.`);
        }
        if (advance.advance_scope === 'JOB_ORDER' && cost.job_order_id !== advance.job_order_id) {
          throw new Error(`Operation Cost (ID: ${cost.id}) berbeda konteks Job Order.`);
        }

        const mapping = activeMappings.get(cost.cost_type);
        if (!mapping) {
          throw new Error(`Settlement tidak dapat disetujui karena ${cost.cost_type} tidak memiliki mapping Expense Account aktif.`);
        }

        // Write the snapshot back into settlement_items
        await connection.query(
          `UPDATE settlement_items 
           SET expense_account_id = ?, 
               expense_account_code_snapshot = ?, 
               expense_account_name_snapshot = ? 
           WHERE id = ?`,
          [mapping.account_id, mapping.account_code, mapping.account_name, item.id]
        );

        totalExpense += parseFloat(cost.amount);
      }

      const totalAdvance = parseFloat(settlement.total_advance);
      const difference = totalAdvance - totalExpense;

      // Update settlement status & amounts
      await SettlementModel.update(settlementId, {
        total_expense: totalExpense,
        difference: difference,
        status: 'APPROVED',
        approved_by: userId,
        approved_at: new Date(),
        rejection_reason: null
      }, connection);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async reject(settlementId, userId, rejectionReason) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [stlRows] = await connection.query('SELECT * FROM settlements WHERE id = ? FOR UPDATE', [settlementId]);
      if (stlRows.length === 0) throw new Error('Settlement tidak ditemukan');
      
      const settlement = stlRows[0];
      if (settlement.status !== 'SUBMITTED') {
        throw new Error('Hanya Settlement berstatus SUBMITTED yang dapat ditolak');
      }

      if (settlement.created_by === userId || settlement.submitted_by === userId) {
        throw new Error('Pemisahan tugas: Anda tidak dapat menolak Settlement yang Anda buat atau submit sendiri');
      }

      await SettlementModel.update(settlementId, {
        status: 'REJECTED',
        approved_by: userId, // or rejected_by based on schema convention, assuming approved_by is actor
        approved_at: new Date(),
        rejection_reason: rejectionReason
      }, connection);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async revise(settlementId, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [stlRows] = await connection.query('SELECT * FROM settlements WHERE id = ? FOR UPDATE', [settlementId]);
      if (stlRows.length === 0) throw new Error('Settlement tidak ditemukan');
      
      const settlement = stlRows[0];
      if (settlement.status !== 'REJECTED') {
        throw new Error('Hanya Settlement berstatus REJECTED yang dapat direvisi (kembali ke DRAFT)');
      }

      await SettlementModel.update(settlementId, {
        status: 'DRAFT'
      }, connection);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async _preparePostingPayload(settlementId, cashAccountId, connection) {
    // 1. Get Settlement and lock it
    const [stlRows] = await connection.query('SELECT * FROM settlements WHERE id = ? FOR UPDATE', [settlementId]);
    if (stlRows.length === 0) {
      const err = new Error('Settlement tidak ditemukan'); err.statusCode = 404; throw err;
    }
    const settlement = stlRows[0];
    
    if (settlement.status !== 'APPROVED') {
      const err = new Error('Hanya Settlement berstatus APPROVED yang dapat diposting'); err.statusCode = 409; throw err;
    }
    if (settlement.transaction_id !== null) {
      const err = new Error('Settlement ini sudah diposting sebelumnya'); err.statusCode = 409; throw err;
    }

    // Lock Cash Advance
    const [caRows] = await connection.query('SELECT * FROM cash_advances WHERE id = ? FOR UPDATE', [settlement.cash_advance_id]);
    const advance = caRows[0];
    if (!advance || advance.status !== 'DISBURSED' || advance.transaction_id === null) {
      const err = new Error('Cash Advance belum dicairkan atau tidak memiliki transaksi valid'); err.statusCode = 409; throw err;
    }

    // 2. Resolve OPERATIONAL_ADVANCE_CLEARING
    const opAdvanceAccount = await SystemAccountMappingModel.resolveAccount('OPERATIONAL_ADVANCE_CLEARING');
    if (!opAdvanceAccount || opAdvanceAccount.is_active !== 1 || opAdvanceAccount.allow_posting !== 1) {
      const err = new Error('Akun kliring Operational Advance tidak valid atau tidak aktif'); err.statusCode = 400; throw err;
    }

    // 3. Resolve Cash Account if difference != 0
    let cashAccount = null;
    const difference = DecimalHelper.roundToTwo(settlement.difference);
    
    if (Math.abs(difference) > 0.00) {
      if (!cashAccountId) {
        const err = new Error('Akun Kas/Bank wajib dipilih karena terdapat selisih settlement'); err.statusCode = 400; throw err;
      }
      cashAccount = await CoaModel.findById(cashAccountId);
      if (!cashAccount || cashAccount.account_subtype !== 'CASH_BANK' || cashAccount.allow_posting !== 1 || cashAccount.is_active !== 1) {
        const err = new Error('Akun Kas/Bank yang dipilih tidak valid atau tidak aktif'); err.statusCode = 400; throw err;
      }
    }

    // 4. Generate Journals & Validations
    const journalEntries = [];
    let totalDebitExpense = 0;

    const items = await SettlementModel.getItems(settlementId, connection);
    if (items.length === 0) {
      const err = new Error('Settlement harus memiliki minimal satu Operation Cost'); err.statusCode = 400; throw err;
    }

    for (const item of items) {
      if (item.cost_status !== 'APPROVED') {
        const err = new Error(`Operation Cost (ID: ${item.operation_cost_id}) tidak lagi APPROVED`); err.statusCode = 409; throw err;
      }

      if (!item.expense_account_id) {
         const err = new Error(`Item biaya ${item.cost_type} tidak memiliki snapshot akun expense (belum diverifikasi saat Approval)`); err.statusCode = 400; throw err;
      }
      
      const [accRows] = await connection.query('SELECT * FROM accounts WHERE id = ? FOR UPDATE', [item.expense_account_id]);
      if (accRows.length === 0 || accRows[0].is_active !== 1 || accRows[0].allow_posting !== 1 || accRows[0].type !== 'EXPENSE') {
         const err = new Error(`Akun expense ${item.expense_account_code_snapshot} tidak lagi valid untuk diposting`); err.statusCode = 400; throw err;
      }
      
      const amt = DecimalHelper.roundToTwo(item.settled_amount);
      totalDebitExpense += amt;

      journalEntries.push({
        accountId: item.expense_account_id,
        accountName: item.expense_account_name_snapshot,
        accountCode: item.expense_account_code_snapshot,
        type: 'DEBIT',
        amount: amt
      });
    }

    // Decimal-safe validation
    const totalExpenseModel = DecimalHelper.roundToTwo(settlement.total_expense);
    if (Math.abs(totalDebitExpense - totalExpenseModel) > 0.00) {
      const err = new Error(`SUM(Debit Expense) = ${totalDebitExpense} tidak sesuai dengan Total Expense = ${totalExpenseModel}`); err.statusCode = 400; throw err;
    }

    // Add Operational Advance (Credit)
    const advanceAmt = DecimalHelper.roundToTwo(settlement.total_advance);
    journalEntries.push({
      accountId: opAdvanceAccount.id,
      accountName: opAdvanceAccount.name,
      accountCode: opAdvanceAccount.code,
      type: 'CREDIT',
      amount: advanceAmt
    });

    // Handle Difference using precise calculation
    const calcDiff = DecimalHelper.subtract(advanceAmt, totalDebitExpense);
    if (Math.abs(calcDiff - difference) > 0.00) {
      const err = new Error(`Kalkulasi selisih tidak sesuai (Backend: ${calcDiff} vs Model: ${difference})`); err.statusCode = 400; throw err;
    }

    if (calcDiff > 0.00) {
      // Advance > Expense -> Unused Cash -> Debit Cash
      journalEntries.push({
        accountId: cashAccount.id,
        accountName: cashAccount.name,
        accountCode: cashAccount.code,
        type: 'DEBIT',
        amount: calcDiff
      });
    } else if (calcDiff < 0.00) {
      // Expense > Advance -> Reimbursement -> Credit Cash
      journalEntries.push({
        accountId: cashAccount.id,
        accountName: cashAccount.name,
        accountCode: cashAccount.code,
        type: 'CREDIT',
        amount: Math.abs(calcDiff)
      });
    }

    const CashAdvanceModel = require('../models/cashAdvanceModel');
    const advanceEnriched = await CashAdvanceModel.findById(settlement.cash_advance_id);
    const reference = advanceEnriched.job_order_number || advanceEnriched.operation_no || advanceEnriched.advance_scope;

    const description = `Settlement Posting ${settlement.settlement_no} | CA: ${advance.advance_no}\nOperation/Job Order: ${reference}`;

    return {
      settlementId: settlement.id,
      settlementNo: settlement.settlement_no,
      totalDebitExpense,
      totalAdvance: advanceAmt,
      calcDiff,
      transactionData: {
        date: new Date().toISOString().slice(0, 10),
        type: 'JOURNAL',
        description,
        amount: Math.max(advanceAmt, totalDebitExpense),
        journalEntries
      }
    };
  }

  static async postingPreview(settlementId, cashAccountId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const payload = await this._preparePostingPayload(settlementId, cashAccountId, connection);
      await connection.rollback(); // read-only check
      return payload.transactionData;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async post(settlementId, userId, payloadData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const payload = await this._preparePostingPayload(settlementId, payloadData.cash_account_id, connection);
      const sourceData = {
        sourceType: 'SETTLEMENT_POSTING',
        sourceId: payload.settlementId,
        sourceNumber: payload.settlementNo
      };
      
      const newTrxId = await TransactionService.postSettlement(payload, userId, connection, sourceData);
      
      await connection.commit();
      return newTrxId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Internal helper
  static async _recalculateTotals(settlementId, connection) {
    const items = await SettlementModel.getItems(settlementId, connection);
    let totalExpense = 0;
    items.forEach(item => {
      totalExpense += parseFloat(item.settled_amount);
    });

    const [stlRows] = await connection.query('SELECT total_advance FROM settlements WHERE id = ?', [settlementId]);
    if (stlRows.length > 0) {
      const totalAdvance = parseFloat(stlRows[0].total_advance);
      const difference = totalAdvance - totalExpense;
      await SettlementModel.update(settlementId, {
        total_expense: totalExpense,
        difference: difference
      }, connection);
    }
  }
}

module.exports = SettlementService;
