const db = require('../config/db');

class CostTypeMappingModel {
  static async getAll() {
    const [rows] = await db.query(`
      SELECT m.*, a.name as account_name, a.code as account_code, a.type as account_type
      FROM cost_type_account_mappings m
      JOIN accounts a ON m.account_id = a.id
      ORDER BY m.cost_type ASC
    `);
    return rows;
  }

  static async findByCostType(costType) {
    const [rows] = await db.query(`
      SELECT m.*, a.name as account_name, a.code as account_code, a.type as account_type
      FROM cost_type_account_mappings m
      JOIN accounts a ON m.account_id = a.id
      WHERE m.cost_type = ?
    `, [costType]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT m.*, a.name as account_name, a.code as account_code, a.type as account_type
      FROM cost_type_account_mappings m
      JOIN accounts a ON m.account_id = a.id
      WHERE m.id = ?
    `, [id]);
    return rows[0];
  }

  static async create(data, userId) {
    const [result] = await db.query(`
      INSERT INTO cost_type_account_mappings (cost_type, account_id, is_active, created_by)
      VALUES (?, ?, ?, ?)
    `, [data.cost_type, data.account_id, data.is_active !== undefined ? data.is_active : true, userId]);
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.cost_type !== undefined) {
      fields.push('cost_type = ?');
      values.push(data.cost_type);
    }
    if (data.account_id !== undefined) {
      fields.push('account_id = ?');
      values.push(data.account_id);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active);
    }
    
    if (fields.length === 0) return 0;
    
    values.push(id);
    const [result] = await db.query(`
      UPDATE cost_type_account_mappings 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `, values);
    return result.affectedRows;
  }
}

module.exports = CostTypeMappingModel;
