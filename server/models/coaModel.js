const db = require('../config/db');

class CoaModel {
  /**
   * Get all accounts
   */
  static async getAll() {
    const query = `
      SELECT 
        a.id, a.code, a.name, a.type, a.category, a.parent_id, a.is_active, a.created_at,
        p.name AS parent_name
      FROM accounts a
      LEFT JOIN accounts p ON a.parent_id = p.id
      ORDER BY a.code ASC
    `;
    const [rows] = await db.query(query);
    return rows;
  }

  /**
   * Find account by ID
   * @param {number} id 
   */
  static async findById(id) {
    const query = `
      SELECT a.*, p.name AS parent_name 
      FROM accounts a 
      LEFT JOIN accounts p ON a.parent_id = p.id 
      WHERE a.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Find account by Code
   * @param {string} code 
   */
  static async findByCode(code) {
    const [rows] = await db.query('SELECT * FROM accounts WHERE code = ?', [code]);
    return rows[0] || null;
  }

  /**
   * Create account
   */
  static async create(data) {
    const { code, name, type, category, parent_id, is_active } = data;
    const query = `
      INSERT INTO accounts (code, name, type, category, parent_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      code,
      name,
      type,
      category,
      parent_id || null,
      is_active !== undefined ? is_active : true
    ]);
    return result.insertId;
  }

  /**
   * Update account
   */
  static async update(id, data) {
    const { code, name, type, category, parent_id, is_active } = data;
    const query = `
      UPDATE accounts 
      SET code = ?, name = ?, type = ?, category = ?, parent_id = ?, is_active = ?
      WHERE id = ?
    `;
    await db.query(query, [
      code,
      name,
      type,
      category,
      parent_id || null,
      is_active !== undefined ? is_active : true,
      id
    ]);
  }

  /**
   * Check if account is used in journal entries
   */
  static async isUsedInTransactions(id) {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM journal_entries WHERE account_id = ?', [id]);
    return rows[0].count > 0;
  }

  /**
   * Delete account
   */
  static async delete(id) {
    await db.query('DELETE FROM accounts WHERE id = ?', [id]);
  }
}

module.exports = CoaModel;
