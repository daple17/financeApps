const db = require('../config/db');

class TransactionModel {
  /**
   * Insert transaction and journal entries atomically
   */
  static async createWithJournals(transactionData, journalEntries) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert Transaction
      const trxQuery = `
        INSERT INTO transactions 
          (transaction_number, date, type, description, amount, status, attachment_url, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [trxResult] = await connection.query(trxQuery, [
        transactionData.transactionNumber,
        transactionData.date,
        transactionData.type,
        transactionData.description,
        transactionData.amount,
        transactionData.status,
        transactionData.attachmentUrl || null,
        transactionData.createdBy
      ]);

      const transactionId = trxResult.insertId;

      // 2. Insert Journal Entries (Debit & Credit)
      const journalQuery = `
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount)
        VALUES ?
      `;

      const values = journalEntries.map(entry => [
        transactionId,
        entry.accountId,
        entry.type,
        entry.amount
      ]);

      await connection.query(journalQuery, [values]);

      await connection.commit();
      return transactionId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get list of transactions with pagination and filters
   */
  static async findAll({ type, status, startDate, endDate, limit = 20, offset = 0 }) {
    let query = `
      SELECT 
        t.*,
        u.name AS created_by_name,
        a.name AS approved_by_name
      FROM transactions t
      JOIN users u ON t.created_by = u.id
      LEFT JOIN users a ON t.approved_by = a.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      query += ` AND t.type = ?`;
      params.push(type);
    }

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (startDate && endDate) {
      query += ` AND t.date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM transactions WHERE 1=1`;
    const countParams = [];
    if (type) { countQuery += ` AND type = ?`; countParams.push(type); }
    if (status) { countQuery += ` AND status = ?`; countParams.push(status); }
    if (startDate && endDate) { countQuery += ` AND date BETWEEN ? AND ?`; countParams.push(startDate, endDate); }
    
    const [countRows] = await db.query(countQuery, countParams);

    return {
      data: rows,
      total: countRows[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
  }

  /**
   * Get single transaction details with journal entries
   */
  static async findById(id) {
    const trxQuery = `
      SELECT 
        t.*,
        u.name AS created_by_name,
        a.name AS approved_by_name
      FROM transactions t
      JOIN users u ON t.created_by = u.id
      LEFT JOIN users a ON t.approved_by = a.id
      WHERE t.id = ?
    `;
    const [trxRows] = await db.query(trxQuery, [id]);
    if (trxRows.length === 0) return null;

    const transaction = trxRows[0];

    // Fetch journal entries
    const journalQuery = `
      SELECT 
        j.*,
        acc.code AS account_code,
        acc.name AS account_name,
        acc.type AS account_type
      FROM journal_entries j
      JOIN accounts acc ON j.account_id = acc.id
      WHERE j.transaction_id = ?
    `;
    const [journalRows] = await db.query(journalQuery, [id]);

    return {
      ...transaction,
      journal_entries: journalRows
    };
  }

  /**
   * Update transaction status (Approve / Reject)
   */
  static async updateStatus(id, status, approvedBy, rejectionReason = null) {
    const query = `
      UPDATE transactions 
      SET status = ?, approved_by = ?, rejection_reason = ?
      WHERE id = ?
    `;
    await db.query(query, [status, approvedBy, rejectionReason, id]);
  }
}

module.exports = TransactionModel;
