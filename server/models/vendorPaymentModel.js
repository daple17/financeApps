const db = require('../config/db');

class VendorPaymentModel {
  static async generateSequenceNumber(connection) {
    const conn = connection || db;
    const date = new Date();
    const period = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const sequenceKey = 'VP';
    const prefix = `VP-${period}-`;

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

  static async create(data, connection) {
    const conn = connection || db;
    const {
      payment_no,
      payment_date,
      vendor_id,
      cash_account_id,
      total_amount,
      notes,
      status,
      transaction_id,
      created_by
    } = data;

    const [result] = await conn.query(
      `INSERT INTO vendor_payments 
      (payment_no, payment_date, vendor_id, cash_account_id, total_amount, notes, status, transaction_id, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [payment_no, payment_date, vendor_id, cash_account_id, total_amount, notes, status, transaction_id, created_by]
    );
    return result.insertId;
  }

  static async createAllocation(data, connection) {
    const conn = connection || db;
    const {
      vendor_payment_id,
      vendor_invoice_id,
      allocated_amount
    } = data;

    const [result] = await conn.query(
      `INSERT INTO vendor_payment_allocations 
      (vendor_payment_id, vendor_invoice_id, allocated_amount) 
      VALUES (?, ?, ?)`,
      [vendor_payment_id, vendor_invoice_id, allocated_amount]
    );
    return result.insertId;
  }

  static async findById(id, connection) {
    const conn = connection || db;
    const [rows] = await conn.query(`SELECT * FROM vendor_payments WHERE id = ?`, [id]);
    return rows[0];
  }
  
  static async findAll(filters = {}) {
    let query = `
      SELECT vp.*, bp.partner_name as vendor_name, acc.name as cash_account_name, acc.code as cash_account_code
      FROM vendor_payments vp
      JOIN business_partners bp ON vp.vendor_id = bp.id
      JOIN accounts acc ON vp.cash_account_id = acc.id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.vendor_id) {
      query += ` AND vp.vendor_id = ?`;
      params.push(filters.vendor_id);
    }
    
    query += ` ORDER BY vp.created_at DESC`;
    
    const [rows] = await db.query(query, params);
    return rows;
  }
  
  static async getAllocationsByPaymentId(paymentId, connection) {
    const conn = connection || db;
    const [rows] = await conn.query(
      `SELECT vpa.*, vi.ap_invoice_no, vi.vendor_invoice_number, vi.total_amount as invoice_total
       FROM vendor_payment_allocations vpa
       JOIN vendor_invoices vi ON vpa.vendor_invoice_id = vi.id
       WHERE vpa.vendor_payment_id = ?`,
      [paymentId]
    );
    return rows;
  }
  
  static async getAllocationsByInvoiceId(invoiceId, connection) {
    const conn = connection || db;
    const [rows] = await conn.query(
      `SELECT vpa.*, vp.payment_no, vp.payment_date, vp.status as payment_status
       FROM vendor_payment_allocations vpa
       JOIN vendor_payments vp ON vpa.vendor_payment_id = vp.id
       WHERE vpa.vendor_invoice_id = ?`,
      [invoiceId]
    );
    return rows;
  }
}

module.exports = VendorPaymentModel;
