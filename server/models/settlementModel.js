const db = require('../config/db');

class SettlementModel {
  // --- SETTLEMENTS ---

  static async generateSequenceNumber(connection) {
    const conn = connection || db;
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `STL-${yearMonth}-`;
    
    // Use an exclusive lock or rely on a safe mechanism, but typically we do MAX query
    const [rows] = await conn.query(`
      SELECT settlement_no 
      FROM settlements 
      WHERE settlement_no LIKE ? 
      ORDER BY id DESC LIMIT 1
    `, [`${prefix}%`]);
    
    let nextNum = 1;
    if (rows.length > 0) {
      const lastNo = rows[0].settlement_no;
      const lastSequence = parseInt(lastNo.replace(prefix, ''), 10);
      if (!isNaN(lastSequence)) {
        nextNum = lastSequence + 1;
      }
    }
    
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  static async create(data, connection) {
    const conn = connection || db;
    const { settlement_no, cash_advance_id, total_advance, settlement_date, created_by } = data;
    
    const [result] = await conn.query(`
      INSERT INTO settlements (settlement_no, cash_advance_id, total_advance, settlement_date, created_by)
      VALUES (?, ?, ?, ?, ?)
    `, [settlement_no, cash_advance_id, total_advance, settlement_date, created_by]);
    
    return result.insertId;
  }

  static async findById(id, connection) {
    const conn = connection || db;
    const [rows] = await conn.query(`
      SELECT s.*, c.advance_no, c.advance_scope, c.operation_id, c.job_order_id, c.driver_id 
      FROM settlements s
      JOIN cash_advances c ON s.cash_advance_id = c.id
      WHERE s.id = ?
    `, [id]);
    return rows[0];
  }

  static async findByCashAdvanceId(cashAdvanceId, connection) {
    const conn = connection || db;
    const [rows] = await conn.query(`SELECT * FROM settlements WHERE cash_advance_id = ?`, [cashAdvanceId]);
    return rows[0];
  }

  static async findAll(filters = {}, connection) {
    const conn = connection || db;
    let query = `
      SELECT s.*, c.advance_no, c.advance_scope, c.operation_id, c.job_order_id,
             u.name as recipient_name, jo.job_order_number, op.operation_no
      FROM settlements s
      JOIN cash_advances c ON s.cash_advance_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN job_orders jo ON c.job_order_id = jo.id
      LEFT JOIN operations op ON c.operation_id = op.id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.status) {
      query += ` AND s.status = ?`;
      params.push(filters.status);
    }
    
    if (filters.search) {
      query += ` AND (s.settlement_no LIKE ? OR c.advance_no LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    query += ` ORDER BY s.id DESC`;
    
    const [rows] = await conn.query(query, params);
    return rows;
  }

  static async getEligibleAdvances(connection) {
    const conn = connection || db;
    // status = DISBURSED, transaction_id IS NOT NULL, scope != GENERAL, no existing settlement
    const query = `
      SELECT c.*, jo.job_order_number, op.operation_no, u.name as recipient_name
      FROM cash_advances c
      LEFT JOIN settlements s ON c.id = s.cash_advance_id
      LEFT JOIN job_orders jo ON c.job_order_id = jo.id
      LEFT JOIN operations op ON c.operation_id = op.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.status = 'DISBURSED'
        AND c.transaction_id IS NOT NULL
        AND c.advance_scope != 'GENERAL'
        AND s.id IS NULL
      ORDER BY c.id DESC
    `;
    const [rows] = await conn.query(query);
    return rows;
  }

  static async update(id, data, connection) {
    const conn = connection || db;
    const fields = [];
    const values = [];
    
    const allowedFields = [
      'total_expense', 'difference', 'status', 'notes', 'rejection_reason',
      'submitted_by', 'submitted_at', 'approved_by', 'approved_at', 
      'posted_by', 'posted_at', 'transaction_id'
    ];
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });
    
    if (fields.length === 0) return 0;
    
    values.push(id);
    const [result] = await conn.query(`UPDATE settlements SET ${fields.join(', ')} WHERE id = ?`, values);
    return result.affectedRows;
  }

  static async delete(id, connection) {
    const conn = connection || db;
    const [result] = await conn.query(`DELETE FROM settlements WHERE id = ? AND status = 'DRAFT'`, [id]);
    return result.affectedRows;
  }

  // --- SETTLEMENT ITEMS ---

  static async getItems(settlementId, connection) {
    const conn = connection || db;
    const [rows] = await conn.query(`
      SELECT si.*, 
             oc.cost_type, oc.description, oc.amount as original_amount, oc.vendor_id, oc.status as cost_status, oc.transaction_date,
             ctam.is_active as mapping_active,
             coa.id as account_id, coa.code as account_code, coa.name as account_name
      FROM settlement_items si
      JOIN operation_costs oc ON si.operation_cost_id = oc.id
      LEFT JOIN cost_type_account_mappings ctam ON oc.cost_type = ctam.cost_type
      LEFT JOIN accounts coa ON ctam.account_id = coa.id
      WHERE si.settlement_id = ?
    `, [settlementId]);
    return rows;
  }

  static async addItem(data, connection) {
    const conn = connection || db;
    const { settlement_id, operation_cost_id, settled_amount } = data;
    
    const [result] = await conn.query(`
      INSERT INTO settlement_items (settlement_id, operation_cost_id, settled_amount)
      VALUES (?, ?, ?)
    `, [settlement_id, operation_cost_id, settled_amount]);
    
    return result.insertId;
  }

  static async removeItem(id, settlementId, connection) {
    const conn = connection || db;
    const [result] = await conn.query(`
      DELETE FROM settlement_items WHERE id = ? AND settlement_id = ?
    `, [id, settlementId]);
    return result.affectedRows;
  }

  static async getItemByOperationCostId(operationCostId, connection) {
    const conn = connection || db;
    const [rows] = await conn.query(`SELECT * FROM settlement_items WHERE operation_cost_id = ?`, [operationCostId]);
    return rows[0];
  }

  static async getEligibleCostsForSettlement(settlement, connection) {
    const conn = connection || db;
    let query = `
      SELECT oc.* 
      FROM operation_costs oc
      LEFT JOIN settlement_items si ON oc.id = si.operation_cost_id
      WHERE oc.status = 'APPROVED'
      AND oc.vendor_id IS NULL
      AND si.id IS NULL
    `;
    const params = [];

    if (settlement.advance_scope === 'OPERATION') {
      query += ` AND oc.operation_id = ?`;
      params.push(settlement.operation_id);
    } else if (settlement.advance_scope === 'JOB_ORDER') {
      query += ` AND oc.job_order_id = ?`;
      params.push(settlement.job_order_id);
    } else {
      return []; // General scope is unsupported for operation_costs
    }

    const [rows] = await conn.query(query, params);
    return rows;
  }
}

module.exports = SettlementModel;
