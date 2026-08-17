const db = require('../config/db');

class VendorInvoiceModel {
  static async generateSequenceNumber(connection) {
    const conn = connection || db;
    const date = new Date();
    const period = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const sequenceKey = 'AP_INVOICE';
    const prefix = `AP-${period}-`;

    await conn.query(
      `INSERT INTO document_sequences (sequence_key, period_key, last_number) 
       VALUES (?, ?, LAST_INSERT_ID(1)) 
       ON DUPLICATE KEY UPDATE last_number = LAST_INSERT_ID(last_number + 1)`,
      [sequenceKey, period]
    );

    const [rows] = await conn.query(
      `SELECT LAST_INSERT_ID() as last_number`,
      [sequenceKey, period]
    );
    
    const nextNum = rows[0].last_number;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  static async normalizeInvoiceNumber(invoiceNo) {
    if (!invoiceNo) return '';
    return invoiceNo.trim().toUpperCase().replace(/\s+/g, ' ');
  }

  static async create(data, connection) {
    const conn = connection || db;
    const {
      ap_invoice_no, vendor_invoice_number, normalized_invoice_number,
      vendor_id, invoice_date, due_date, currency, created_by, notes
    } = data;

    const [result] = await conn.query(`
      INSERT INTO vendor_invoices (
        ap_invoice_no, vendor_invoice_number, normalized_invoice_number,
        vendor_id, invoice_date, due_date, currency, created_by, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')
    `, [ap_invoice_no, vendor_invoice_number, normalized_invoice_number, vendor_id, invoice_date, due_date, currency || 'IDR', created_by, notes || null]);
    
    return result.insertId;
  }

  static async findById(id, connection) {
    const conn = connection || db;
    const [rows] = await conn.query(`
      SELECT vi.*, bp.partner_name as vendor_name, bp.partner_code as vendor_code,
             u1.name as created_by_name, u2.name as submitted_by_name
      FROM vendor_invoices vi
      JOIN business_partners bp ON vi.vendor_id = bp.id
      LEFT JOIN users u1 ON vi.created_by = u1.id
      LEFT JOIN users u2 ON vi.submitted_by = u2.id
      WHERE vi.id = ?
    `, [id]);
    return rows[0];
  }

  static async updateDraft(id, data, connection) {
    const conn = connection || db;
    const { vendor_invoice_number, normalized_invoice_number, invoice_date, due_date, notes } = data;
    
    const [result] = await conn.query(`
      UPDATE vendor_invoices 
      SET vendor_invoice_number = ?, normalized_invoice_number = ?, 
          invoice_date = ?, due_date = ?, notes = ?
      WHERE id = ? AND status = 'DRAFT'
    `, [vendor_invoice_number, normalized_invoice_number, invoice_date, due_date, notes || null, id]);
    
    return result.affectedRows > 0;
  }

  static async deleteDraft(id, connection) {
    const conn = connection || db;
    const [result] = await conn.query(`DELETE FROM vendor_invoices WHERE id = ? AND status = 'DRAFT'`, [id]);
    return result.affectedRows > 0;
  }

  static async findByIdWithLock(id, connection) {
    const conn = connection || db;
    const [rows] = await conn.query(
      `SELECT vi.*, bp.partner_name as vendor_name 
       FROM vendor_invoices vi
       JOIN business_partners bp ON vi.vendor_id = bp.id
       WHERE vi.id = ? FOR UPDATE`,
      [id]
    );
    return rows[0];
  }

  static async findAll(filters = {}, connection) {
    const conn = connection || db;
    let query = `
      SELECT vi.*, bp.partner_name as vendor_name
      FROM vendor_invoices vi
      JOIN business_partners bp ON vi.vendor_id = bp.id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.status) {
      query += ` AND vi.status = ?`;
      params.push(filters.status);
    }
    
    if (filters.vendor_id) {
      query += ` AND vi.vendor_id = ?`;
      params.push(filters.vendor_id);
    }
    
    if (filters.search) {
      query += ` AND (vi.ap_invoice_no LIKE ? OR vi.vendor_invoice_number LIKE ? OR bp.partner_name LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    
    query += ` ORDER BY vi.id DESC`;
    
    const [rows] = await conn.query(query, params);
    return rows;
  }

  // --- ITEM MANAGEMENT ---
  
  static async getItems(vendorInvoiceId, connection) {
    const conn = connection || db;
    const [rows] = await conn.query(`
      SELECT vii.*, oc.cost_type, oc.description, oc.transaction_date, 
             oc.reference_no, op.operation_no, jo.job_order_number
      FROM vendor_invoice_items vii
      JOIN operation_costs oc ON vii.operation_cost_id = oc.id
      LEFT JOIN operations op ON oc.operation_id = op.id
      LEFT JOIN job_orders jo ON oc.job_order_id = jo.id
      WHERE vii.vendor_invoice_id = ?
    `, [vendorInvoiceId]);
    return rows;
  }

  static async addItem(vendorInvoiceId, operationCostId, invoiceAmount, connection) {
    const conn = connection || db;
    const [result] = await conn.query(`
      INSERT INTO vendor_invoice_items (vendor_invoice_id, operation_cost_id, invoice_amount)
      VALUES (?, ?, ?)
    `, [vendorInvoiceId, operationCostId, invoiceAmount]);
    return result.insertId;
  }

  static async removeItem(itemId, vendorInvoiceId, connection) {
    const conn = connection || db;
    const [result] = await conn.query(`
      DELETE FROM vendor_invoice_items WHERE id = ? AND vendor_invoice_id = ?
    `, [itemId, vendorInvoiceId]);
    return result.affectedRows;
  }

  static async updateTotals(id, connection) {
    const conn = connection || db;
    
    const [itemRows] = await conn.query(
      `SELECT SUM(invoice_amount) as total
       FROM vendor_invoice_items
       WHERE vendor_invoice_id = ?`,
      [id]
    );

    const subtotal = itemRows[0].total || 0;
    const tax_amount = 0;
    const total_amount = subtotal + tax_amount;

    await conn.query(
      `UPDATE vendor_invoices 
       SET subtotal = ?, tax_amount = ?, total_amount = ?
       WHERE id = ?`,
      [subtotal, tax_amount, total_amount, id]
    );

    return { subtotal, tax_amount, total_amount };
  }

  static async updateStatus(id, status, userId, timestampFields = {}, connection) {
    const conn = connection || db;
    let query = `UPDATE vendor_invoices SET status = ?`;
    const params = [status];

    if (timestampFields.submitted) {
      query += `, submitted_by = ?, submitted_at = NOW()`;
      params.push(userId);
    }
    
    if (timestampFields.approved) {
      query += `, approved_by = ?, approved_at = NOW(), rejection_reason = NULL`;
      params.push(userId);
    }
    
    if (timestampFields.rejected) {
      query += `, approved_by = ?, approved_at = NOW(), rejection_reason = ?`;
      params.push(userId, timestampFields.rejection_reason);
    }
    
    if (timestampFields.revised) {
      query += `, rejection_reason = NULL`;
    }

    if (timestampFields.paid) {
      query += `, paid_by = ?, paid_at = NOW()`;
      params.push(userId);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    const [result] = await conn.query(query, params);
    return result.affectedRows > 0;
  }

  static async updateItemSnapshot(itemId, accountData, connection) {
    const conn = connection || db;
    const [result] = await conn.query(
      `UPDATE vendor_invoice_items 
       SET expense_account_id = ?, 
           expense_account_code_snapshot = ?, 
           expense_account_name_snapshot = ?
       WHERE id = ?`,
      [accountData.account_id, accountData.account_code, accountData.account_name, itemId]
    );
    return result.affectedRows > 0;
  }

  static async getPendingApprovals(connection) {
    const conn = connection || db;
    const [rows] = await conn.query(`
      SELECT vi.*, bp.partner_name as vendor_name, u.name as submitted_by_name,
             (SELECT COUNT(*) FROM vendor_invoice_items vii WHERE vii.vendor_invoice_id = vi.id) as item_count
      FROM vendor_invoices vi
      JOIN business_partners bp ON vi.vendor_id = bp.id
      LEFT JOIN users u ON vi.submitted_by = u.id
      WHERE vi.status = 'SUBMITTED'
      ORDER BY vi.submitted_at DESC
    `);
    return rows;
  }

  static async getDashboardSummary(connection) {
    const conn = connection || require('../config/db');
    const [rows] = await conn.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'SUBMITTED' THEN 1 ELSE 0 END) as submitted_count,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'POSTED' THEN 1 ELSE 0 END) as posted_count,
        SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid_count
      FROM vendor_invoices
    `);
    
    const row = rows[0] || {};
    return {
      total: parseInt(row.total || 0, 10),
      draft: parseInt(row.draft_count || 0, 10),
      submitted: parseInt(row.submitted_count || 0, 10),
      approved: parseInt(row.approved_count || 0, 10),
      posted: parseInt(row.posted_count || 0, 10),
      paid: parseInt(row.paid_count || 0, 10)
    };
  }

}

module.exports = VendorInvoiceModel;
