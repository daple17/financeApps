const db = require('../config/db');
const VendorInvoiceModel = require('../models/vendorInvoiceModel');
const OperationCostModel = require('../models/operationCostModel');
const AuditLogModel = require('../models/auditLogModel');
const CostTypeMappingModel = require('../models/costTypeMappingModel');
const SystemAccountMappingModel = require('../models/systemAccountMappingModel');

class VendorInvoiceService {
  static async createDraft(data, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Normalize invoice number
      const normalized_invoice_number = await VendorInvoiceModel.normalizeInvoiceNumber(data.vendor_invoice_number);
      
      // We rely on the UNIQUE index (vendor_id, normalized_invoice_number) to prevent duplicates, 
      // which will throw an ER_DUP_ENTRY we catch below.

      // Generate AP number atomically
      const ap_invoice_no = await VendorInvoiceModel.generateSequenceNumber(connection);

      const invoiceData = {
        ap_invoice_no,
        vendor_invoice_number: data.vendor_invoice_number,
        normalized_invoice_number,
        vendor_id: data.vendor_id,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        currency: data.currency || 'IDR',
        created_by: userId,
        notes: data.notes
      };

      const invoiceId = await VendorInvoiceModel.create(invoiceData, connection);
      
      await AuditLogModel.create({
        action: 'VENDOR_INVOICE_CREATED',
        entity_type: 'VENDOR_INVOICE',
        entity_id: invoiceId,
        user_id: userId,
        details: { ap_invoice_no, vendor_id: data.vendor_id }
      }, connection);

      await connection.commit();
      return invoiceId;
    } catch (error) {
      await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') {
        const conflictError = new Error('Vendor Invoice dengan nomor tersebut sudah terdaftar untuk Vendor ini');
        conflictError.statusCode = 409;
        throw conflictError;
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateDraft(id, data, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const invoice = await VendorInvoiceModel.findById(id, connection);
      if (!invoice) throw new Error('Vendor Invoice tidak ditemukan');
      if (invoice.status !== 'DRAFT') throw new Error('Hanya Vendor Invoice berstatus DRAFT yang dapat diubah');

      const normalized_invoice_number = await VendorInvoiceModel.normalizeInvoiceNumber(data.vendor_invoice_number);

      const updateData = {
        vendor_invoice_number: data.vendor_invoice_number,
        normalized_invoice_number,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        notes: data.notes
      };

      await VendorInvoiceModel.updateDraft(id, updateData, connection);

      await AuditLogModel.create({
        action: 'VENDOR_INVOICE_UPDATED',
        entity_type: 'VENDOR_INVOICE',
        entity_id: id,
        user_id: userId,
        details: { updated_fields: updateData }
      }, connection);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') {
        const conflictError = new Error('Vendor Invoice dengan nomor tersebut sudah terdaftar untuk Vendor ini');
        conflictError.statusCode = 409;
        throw conflictError;
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  static async deleteDraft(id, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const invoice = await VendorInvoiceModel.findById(id, connection);
      if (!invoice) throw new Error('Vendor Invoice tidak ditemukan');
      if (invoice.status !== 'DRAFT') throw new Error('Hanya Vendor Invoice berstatus DRAFT yang dapat dihapus');

      await VendorInvoiceModel.deleteDraft(id, connection);

      await AuditLogModel.create({
        action: 'VENDOR_INVOICE_DELETED',
        entity_type: 'VENDOR_INVOICE',
        entity_id: id,
        user_id: userId,
        details: { ap_invoice_no: invoice.ap_invoice_no }
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

  static async addItem(vendorInvoiceId, operationCostId, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Lock invoice
      const [invRows] = await connection.query('SELECT * FROM vendor_invoices WHERE id = ? FOR UPDATE', [vendorInvoiceId]);
      if (invRows.length === 0) throw new Error('Vendor Invoice tidak ditemukan');
      const invoice = invRows[0];

      if (invoice.status !== 'DRAFT') throw new Error('Item hanya dapat ditambahkan jika Vendor Invoice berstatus DRAFT');

      // Lock and Validate Operation Cost
      const [costRows] = await connection.query('SELECT * FROM operation_costs WHERE id = ? FOR UPDATE', [operationCostId]);
      if (costRows.length === 0) throw new Error('Operation Cost tidak ditemukan');
      const cost = costRows[0];

      if (cost.status !== 'APPROVED') throw new Error('Hanya Operation Cost berstatus APPROVED yang dapat ditagihkan');
      if (cost.vendor_id !== invoice.vendor_id) throw new Error('Vendor pada Operation Cost tidak sesuai dengan Vendor Invoice');

      // Check if already in another invoice (vendor_invoice_items)
      const [viiRows] = await connection.query('SELECT * FROM vendor_invoice_items WHERE operation_cost_id = ? FOR UPDATE', [operationCostId]);
      if (viiRows.length > 0) {
        const conflictError = new Error('Operation Cost ini sudah ditagihkan di Vendor Invoice lain');
        conflictError.statusCode = 409;
        throw conflictError;
      }

      // Check if linked to settlement
      const [siRows] = await connection.query('SELECT * FROM settlement_items WHERE operation_cost_id = ?', [operationCostId]);
      if (siRows.length > 0) throw new Error('Operation Cost ini sudah masuk dalam Settlement Cash Advance');

      // Add Item
      const invoiceAmount = cost.amount; // Copy exact amount server-side
      const itemId = await VendorInvoiceModel.addItem(vendorInvoiceId, operationCostId, invoiceAmount, connection);
      
      const newTotals = await VendorInvoiceModel.updateTotals(vendorInvoiceId, connection);

      await AuditLogModel.create({
        action: 'VENDOR_INVOICE_ITEM_ADDED',
        entity_type: 'VENDOR_INVOICE',
        entity_id: vendorInvoiceId,
        user_id: userId,
        details: { item_id: itemId, operation_cost_id: operationCostId, amount: invoiceAmount, new_totals: newTotals }
      }, connection);

      await connection.commit();
      return itemId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async removeItem(vendorInvoiceId, itemId, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [invRows] = await connection.query('SELECT * FROM vendor_invoices WHERE id = ? FOR UPDATE', [vendorInvoiceId]);
      if (invRows.length === 0) throw new Error('Vendor Invoice tidak ditemukan');
      const invoice = invRows[0];

      if (invoice.status !== 'DRAFT') throw new Error('Item hanya dapat dihapus jika Vendor Invoice berstatus DRAFT');

      const affected = await VendorInvoiceModel.removeItem(itemId, vendorInvoiceId, connection);
      if (affected === 0) throw new Error('Item tidak ditemukan pada Vendor Invoice ini');

      const newTotals = await VendorInvoiceModel.updateTotals(vendorInvoiceId, connection);

      await AuditLogModel.create({
        action: 'VENDOR_INVOICE_ITEM_REMOVED',
        entity_type: 'VENDOR_INVOICE',
        entity_id: vendorInvoiceId,
        user_id: userId,
        details: { item_id: itemId, new_totals: newTotals }
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

  static async submitInvoice(id, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [invRows] = await connection.query('SELECT * FROM vendor_invoices WHERE id = ? FOR UPDATE', [id]);
      if (invRows.length === 0) throw new Error('Vendor Invoice tidak ditemukan');
      const invoice = invRows[0];

      if (invoice.status !== 'DRAFT') throw new Error(`Status saat ini adalah ${invoice.status}, hanya DRAFT yang dapat di-submit`);
      
      const items = await VendorInvoiceModel.getItems(id, connection);
      if (items.length === 0) throw new Error('Vendor Invoice harus memiliki setidaknya satu item (Operation Cost)');

      if (new Date(invoice.due_date) < new Date(invoice.invoice_date)) {
         throw new Error('Due Date tidak boleh lebih awal dari Invoice Date');
      }

      // Revalidate all items
      for (let item of items) {
        const [costRows] = await connection.query('SELECT * FROM operation_costs WHERE id = ? FOR UPDATE', [item.operation_cost_id]);
        if (costRows.length === 0) throw new Error(`Operation Cost (ID: ${item.operation_cost_id}) tidak ditemukan`);
        const cost = costRows[0];

        if (cost.status !== 'APPROVED') throw new Error(`Operation Cost (ID: ${item.operation_cost_id}) tidak lagi berstatus APPROVED`);
        if (cost.vendor_id !== invoice.vendor_id) throw new Error(`Vendor Operation Cost (ID: ${item.operation_cost_id}) tidak sesuai dengan Vendor Invoice`);
        
        const [siRows] = await connection.query('SELECT * FROM settlement_items WHERE operation_cost_id = ?', [item.operation_cost_id]);
        if (siRows.length > 0) throw new Error(`Operation Cost (ID: ${item.operation_cost_id}) sudah masuk dalam Settlement Cash Advance`);
      }

      // Re-verify totals
      const newTotals = await VendorInvoiceModel.updateTotals(id, connection);
      if (parseFloat(newTotals.totalAmount) <= 0) {
        throw new Error('Total Vendor Invoice harus lebih besar dari 0');
      }

      // Update status
      await VendorInvoiceModel.updateStatus(id, 'SUBMITTED', userId, { submitted: true }, connection);

      await AuditLogModel.create({
        action: 'VENDOR_INVOICE_SUBMITTED',
        entity_type: 'VENDOR_INVOICE',
        entity_id: id,
        user_id: userId,
        details: { final_totals: newTotals }
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

  static async getAll(filters) {
    return await VendorInvoiceModel.findAll(filters);
  }

  static async getById(id) {
    const invoice = await VendorInvoiceModel.findById(id);
    if (!invoice) return null;
    const items = await VendorInvoiceModel.getItems(id);
    return { ...invoice, items };
  }

  static async getEligibleCosts(vendorId) {
    return await OperationCostModel.findEligibleForVendorInvoice(vendorId);
  }

  static async getDashboardSummary() {
    return await VendorInvoiceModel.getDashboardSummary();
  }

  static async approve(id, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [invRows] = await connection.query('SELECT * FROM vendor_invoices WHERE id = ? FOR UPDATE', [id]);
      if (invRows.length === 0) throw new Error('Vendor Invoice tidak ditemukan');
      const invoice = invRows[0];

      if (invoice.status !== 'SUBMITTED') {
        const error = new Error(`Status saat ini adalah ${invoice.status}, hanya SUBMITTED yang dapat di-approve`);
        error.statusCode = 409;
        throw error;
      }

      if (invoice.created_by === userId || invoice.submitted_by === userId) {
        const error = new Error('Pemisahan tugas: Anda tidak dapat menyetujui invoice yang Anda buat atau submit sendiri');
        error.statusCode = 403;
        throw error;
      }

      const items = await VendorInvoiceModel.getItems(id, connection);
      if (items.length === 0) throw new Error('Vendor Invoice harus memiliki setidaknya satu item');

      // Check active mappings cache
      const mappings = await CostTypeMappingModel.getAll();
      const activeMappings = new Map();
      mappings.forEach(m => {
        if (m.is_active && m.account_type === 'EXPENSE' && m.account_is_active === 1) {
          activeMappings.set(m.cost_type, m);
        }
      });

      for (let item of items) {
        // Lock and validate operation cost
        const [costRows] = await connection.query('SELECT * FROM operation_costs WHERE id = ? FOR UPDATE', [item.operation_cost_id]);
        if (costRows.length === 0) throw new Error(`Operation Cost (ID: ${item.operation_cost_id}) tidak ditemukan`);
        const cost = costRows[0];

        if (cost.status !== 'APPROVED') throw new Error(`Operation Cost (ID: ${item.operation_cost_id}) tidak lagi berstatus APPROVED`);
        if (cost.vendor_id !== invoice.vendor_id) throw new Error(`Vendor Operation Cost (ID: ${item.operation_cost_id}) tidak sesuai dengan Vendor Invoice`);
        
        const [siRows] = await connection.query('SELECT * FROM settlement_items WHERE operation_cost_id = ?', [item.operation_cost_id]);
        if (siRows.length > 0) throw new Error(`Operation Cost (ID: ${item.operation_cost_id}) sudah masuk dalam Settlement Cash Advance`);

        const mapping = activeMappings.get(cost.cost_type);
        if (!mapping) {
          throw new Error(`Invoice tidak dapat disetujui karena ${cost.cost_type} tidak memiliki mapping Expense Account aktif yang valid.`);
        }

        // Write snapshot
        await VendorInvoiceModel.updateItemSnapshot(item.id, mapping, connection);
      }

      // Re-verify totals
      const newTotals = await VendorInvoiceModel.updateTotals(id, connection);
      if (parseFloat(newTotals.total_amount) <= 0) {
        throw new Error('Total Vendor Invoice harus lebih besar dari 0');
      }

      await VendorInvoiceModel.updateStatus(id, 'APPROVED', userId, { approved: true }, connection);

      await AuditLogModel.create({
        action: 'VENDOR_INVOICE_APPROVED',
        entity_type: 'VENDOR_INVOICE',
        entity_id: id,
        user_id: userId,
        details: { final_totals: newTotals }
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

  static async reject(id, userId, rejectionReason) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [invRows] = await connection.query('SELECT * FROM vendor_invoices WHERE id = ? FOR UPDATE', [id]);
      if (invRows.length === 0) throw new Error('Vendor Invoice tidak ditemukan');
      const invoice = invRows[0];

      if (invoice.status !== 'SUBMITTED') {
        const error = new Error(`Status saat ini adalah ${invoice.status}, hanya SUBMITTED yang dapat di-reject`);
        error.statusCode = 409;
        throw error;
      }

      if (invoice.created_by === userId || invoice.submitted_by === userId) {
        const error = new Error('Pemisahan tugas: Anda tidak dapat menolak invoice yang Anda buat atau submit sendiri');
        error.statusCode = 403;
        throw error;
      }

      if (!rejectionReason) {
        throw new Error('Alasan penolakan wajib diisi');
      }

      await VendorInvoiceModel.updateStatus(id, 'REJECTED', userId, { rejected: true, rejection_reason: rejectionReason }, connection);

      await AuditLogModel.create({
        action: 'VENDOR_INVOICE_REJECTED',
        entity_type: 'VENDOR_INVOICE',
        entity_id: id,
        user_id: userId,
        details: { rejection_reason: rejectionReason }
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

  static async revise(id, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [invRows] = await connection.query('SELECT * FROM vendor_invoices WHERE id = ? FOR UPDATE', [id]);
      if (invRows.length === 0) throw new Error('Vendor Invoice tidak ditemukan');
      const invoice = invRows[0];

      if (invoice.status !== 'REJECTED') {
        const error = new Error('Hanya Vendor Invoice berstatus REJECTED yang dapat direvisi');
        error.statusCode = 409;
        throw error;
      }

      // Clear unexpected snapshots safely
      await connection.query('UPDATE vendor_invoice_items SET expense_account_id = NULL, expense_account_code_snapshot = NULL, expense_account_name_snapshot = NULL WHERE vendor_invoice_id = ?', [id]);

      await VendorInvoiceModel.updateStatus(id, 'DRAFT', userId, { revised: true }, connection);

      await AuditLogModel.create({
        action: 'VENDOR_INVOICE_REVISION_STARTED',
        entity_type: 'VENDOR_INVOICE',
        entity_id: id,
        user_id: userId,
        details: { previous_rejection_reason: invoice.rejection_reason }
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

  // --- PHASE 5.5: LIABILITY POSTING ---

  static async _preparePostingPayload(invoiceId, connection) {
    const [invRows] = await connection.query('SELECT * FROM vendor_invoices WHERE id = ? FOR UPDATE', [invoiceId]);
    if (invRows.length === 0) throw new Error('Vendor Invoice tidak ditemukan');
    const invoice = invRows[0];

    if (invoice.status !== 'APPROVED') {
      const err = new Error('Hanya Vendor Invoice berstatus APPROVED yang dapat diposting');
      err.statusCode = 409;
      throw err;
    }
    if (invoice.transaction_id !== null) {
      const err = new Error('Vendor Invoice ini sudah diposting sebelumnya');
      err.statusCode = 409;
      throw err;
    }

    const items = await VendorInvoiceModel.getItems(invoiceId, connection);
    if (items.length === 0) {
      throw new Error('Vendor Invoice kosong (tidak ada items)');
    }

    const apAccount = await SystemAccountMappingModel.resolveAccount('ACCOUNTS_PAYABLE', connection);
    if (!apAccount) {
      throw new Error('System Account Mapping untuk ACCOUNTS_PAYABLE belum dikonfigurasi');
    }

    const journalEntries = [];
    let totalLiability = 0;
    const expensesMap = new Map();

    for (const item of items) {
      if (!item.expense_account_id) {
        throw new Error(`Item ${item.operation_cost_id} tidak memiliki pemetaan expense_account_id. Pastikan data snapshot valid.`);
      }
      const amount = Number(item.invoice_amount);
      totalLiability += amount;

      if (expensesMap.has(item.expense_account_id)) {
        expensesMap.set(item.expense_account_id, expensesMap.get(item.expense_account_id) + amount);
      } else {
        expensesMap.set(item.expense_account_id, amount);
      }
    }

    // Debit Entries for each Expense Account
    for (const [accountId, amount] of expensesMap.entries()) {
      journalEntries.push({
        accountId,
        type: 'DEBIT',
        amount: amount
      });
    }

    // Credit Entry for AP Liability
    journalEntries.push({
      accountId: apAccount.id,
      type: 'CREDIT',
      amount: totalLiability
    });

    const description = `Pencatatan Hutang Vendor Invoice ${invoice.vendor_invoice_number}`;

    return {
      invoiceId: invoice.id,
      apInvoiceNo: invoice.ap_invoice_no,
      totalLiability,
      transactionData: {
        date: new Date().toISOString().slice(0, 10),
        type: 'JOURNAL',
        description,
        amount: totalLiability,
        journalEntries
      }
    };
  }

  static async getPostingPreview(id, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const payload = await this._preparePostingPayload(id, connection);
      await connection.rollback(); // read-only simulation
      return payload.transactionData;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async postLiability(id, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const payload = await this._preparePostingPayload(id, connection);
      const { transactionData } = payload;
      
      const TransactionService = require('./transactionService'); // lazy load to avoid circular dep
      
      const sourceData = {
        sourceType: 'VENDOR_INVOICE_POSTING',
        sourceId: id,
        sourceNumber: payload.apInvoiceNo
      };

      const transactionId = await TransactionService.createTransaction(
        transactionData, 
        userId, 
        connection, 
        true, // forceApproved
        sourceData
      );

      // Update Vendor Invoice status
      await connection.query(`
        UPDATE vendor_invoices
        SET status = 'POSTED', transaction_id = ?, posted_by = ?, posted_at = NOW()
        WHERE id = ?
      `, [transactionId, userId, id]);

      await AuditLogModel.create({
        action: 'VENDOR_INVOICE_POSTED',
        entity_type: 'VENDOR_INVOICE',
        entity_id: id,
        user_id: userId,
        details: { transaction_id: transactionId, amount: payload.totalLiability }
      }, connection);

      await connection.commit();
      return { success: true, transactionId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = VendorInvoiceService;
