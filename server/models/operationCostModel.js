const db = require('../config/db');

class OperationCostModel {
  static async create(costData, userId) {
    const query = `
      INSERT INTO operation_costs (
        operation_id, job_order_id, cost_type, description, vendor_id,
        amount, currency, transaction_date, reference_no, notes,
        status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      costData.operation_id,
      costData.job_order_id,
      costData.cost_type,
      costData.description,
      costData.vendor_id || null,
      costData.amount,
      costData.currency || 'IDR',
      costData.transaction_date,
      costData.reference_no || null,
      costData.notes || null,
      costData.status || 'DRAFT',
      userId
    ];

    const [result] = await db.query(query, params);
    return result.insertId;
  }

  static async findById(id) {
    const query = `
      SELECT oc.*, 
             u1.name as created_by_name,
             u2.name as approved_by_name,
             u3.name as posted_by_name,
             bp.partner_name as vendor_name,
             op.operation_no
      FROM operation_costs oc
      LEFT JOIN users u1 ON oc.created_by = u1.id
      LEFT JOIN users u2 ON oc.approved_by = u2.id
      LEFT JOIN users u3 ON oc.posted_by = u3.id
      LEFT JOIN business_partners bp ON oc.vendor_id = bp.id
      LEFT JOIN operations op ON oc.operation_id = op.id
      WHERE oc.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async findByOperationId(operationId) {
    const query = `
      SELECT oc.*, 
             u1.name as created_by_name,
             u2.name as approved_by_name,
             bp.partner_name as vendor_name
      FROM operation_costs oc
      LEFT JOIN users u1 ON oc.created_by = u1.id
      LEFT JOIN users u2 ON oc.approved_by = u2.id
      LEFT JOIN business_partners bp ON oc.vendor_id = bp.id
      WHERE oc.operation_id = ?
      ORDER BY oc.transaction_date DESC, oc.created_at DESC
    `;
    const [rows] = await db.query(query, [operationId]);
    return rows;
  }

  static async update(id, costData) {
    const query = `
      UPDATE operation_costs SET
        cost_type = ?, description = ?, vendor_id = ?,
        amount = ?, currency = ?, transaction_date = ?,
        reference_no = ?, notes = ?
      WHERE id = ? AND status IN ('DRAFT', 'SUBMITTED')
    `;
    const params = [
      costData.cost_type,
      costData.description,
      costData.vendor_id || null,
      costData.amount,
      costData.currency || 'IDR',
      costData.transaction_date,
      costData.reference_no || null,
      costData.notes || null,
      id
    ];
    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
  }

  static async updateStatus(id, newStatus, userId) {
    let query = `UPDATE operation_costs SET status = ?`;
    const params = [newStatus];

    if (newStatus === 'APPROVED') {
      query += `, approved_by = ?, approved_at = NOW()`;
      params.push(userId);
    } else if (newStatus === 'POSTED') {
      query += `, posted_by = ?, posted_at = NOW()`;
      params.push(userId);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
  }

  static async updateTransactionId(id, transactionId) {
    const query = `UPDATE operation_costs SET transaction_id = ? WHERE id = ?`;
    const [result] = await db.query(query, [transactionId, id]);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const query = `DELETE FROM operation_costs WHERE id = ? AND status = 'DRAFT'`;
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0;
  }

  static async getJobOrderCostSummary(jobOrderId) {
    const query = `
      SELECT cost_type, 
             SUM(amount) as total_amount, 
             COUNT(id) as count
      FROM operation_costs
      WHERE job_order_id = ? AND status != 'CANCELLED'
      GROUP BY cost_type
    `;
    const [rows] = await db.query(query, [jobOrderId]);
    return rows;
  }
}

module.exports = OperationCostModel;
