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
             bp.partner_name as vendor_name,
             s.settlement_no
      FROM operation_costs oc
      LEFT JOIN users u1 ON oc.created_by = u1.id
      LEFT JOIN users u2 ON oc.approved_by = u2.id
      LEFT JOIN business_partners bp ON oc.vendor_id = bp.id
      LEFT JOIN settlement_items si ON oc.id = si.operation_cost_id
      LEFT JOIN settlements s ON si.settlement_id = s.id
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
        reference_no = ?, notes = ?, status = 'DRAFT',
        rejection_reason = NULL
      WHERE id = ? AND status IN ('DRAFT', 'REJECTED')
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

  static async updateStatus(id, newStatus, userId, expectedCurrentStatus = null, rejectionReason = null) {
    let query = `UPDATE operation_costs SET status = ?`;
    const params = [newStatus];

    if (newStatus === 'APPROVED') {
      query += `, approved_by = ?, approved_at = NOW(), rejection_reason = NULL`;
      params.push(userId);
    } else if (newStatus === 'POSTED') {
      query += `, posted_by = ?, posted_at = NOW()`;
      params.push(userId);
    } else if (newStatus === 'REJECTED') {
      query += `, rejection_reason = ?`;
      params.push(rejectionReason);
    }

    query += ` WHERE id = ?`;
    params.push(id);
    
    if (expectedCurrentStatus) {
      query += ` AND status = ?`;
      params.push(expectedCurrentStatus);
    }

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
  }
  
  static async getPendingApprovals() {
    const query = `
      SELECT 
        oc.*,
        u.name AS created_by_name,
        op.operation_no,
        jo.job_order_number
      FROM operation_costs oc
      JOIN users u ON oc.created_by = u.id
      JOIN operations op ON oc.operation_id = op.id
      JOIN job_orders jo ON oc.job_order_id = jo.id
      WHERE oc.status = 'SUBMITTED'
      ORDER BY oc.updated_at DESC
    `;
    const [rows] = await db.query(query);
    return rows;
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
    // 1. By cost type
    const typeQuery = `
      SELECT cost_type, 
             SUM(amount) as total_amount, 
             COUNT(id) as count
      FROM operation_costs
      WHERE job_order_id = ? AND status != 'CANCELLED'
      GROUP BY cost_type
    `;
    const [byType] = await db.query(typeQuery, [jobOrderId]);

    // 2. By status
    const statusQuery = `
      SELECT status, 
             SUM(amount) as total_amount, 
             COUNT(id) as count
      FROM operation_costs
      WHERE job_order_id = ? AND status != 'CANCELLED'
      GROUP BY status
    `;
    const [byStatus] = await db.query(statusQuery, [jobOrderId]);

    // 3. By operation
    const opQuery = `
      SELECT op.operation_no,
             oc.operation_id,
             SUM(oc.amount) as total_amount, 
             COUNT(oc.id) as count
      FROM operation_costs oc
      LEFT JOIN operations op ON oc.operation_id = op.id
      WHERE oc.job_order_id = ? AND oc.status != 'CANCELLED'
      GROUP BY oc.operation_id, op.operation_no
    `;
    const [byOperation] = await db.query(opQuery, [jobOrderId]);

    return {
      by_type: byType,
      by_status: byStatus,
      by_operation: byOperation
    };
  }
}

module.exports = OperationCostModel;
