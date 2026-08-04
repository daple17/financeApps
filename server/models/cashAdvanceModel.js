const db = require('../config/db');

class CashAdvanceModel {
  /**
   * Generate Cash Advance Number: CA-YYYYMM-XXXX
   * Uses FOR UPDATE to lock rows safely if inside transaction.
   */
  static async generateCashAdvanceNumber(connection, requestDate) {
    const dateObj = new Date(requestDate);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const prefix = `CA-${year}${month}-`;

    const query = `
      SELECT advance_no 
      FROM cash_advances 
      WHERE advance_no LIKE ? 
      ORDER BY id DESC LIMIT 1
      FOR UPDATE
    `;
    const [rows] = await connection.query(query, [`${prefix}%`]);

    let sequence = 1;
    if (rows.length > 0) {
      const lastNumber = rows[0].advance_no;
      const lastSequence = parseInt(lastNumber.split('-')[2], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    const paddedSequence = String(sequence).padStart(4, '0');
    return `${prefix}${paddedSequence}`;
  }

  static async create(data, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Validate scope relationships
      let finalJobOrderId = data.job_order_id || null;
      let finalOperationId = data.operation_id || null;

      if (data.advance_scope === 'OPERATION') {
        if (!data.operation_id) {
          throw new Error('Operation ID is required for OPERATION scope');
        }
        // Derive Job Order from Operation
        const [opRows] = await connection.query('SELECT job_order_id FROM operations WHERE id = ?', [data.operation_id]);
        if (opRows.length === 0) {
          throw new Error('Invalid Operation ID');
        }
        finalOperationId = data.operation_id;
        finalJobOrderId = opRows[0].job_order_id;
      } else if (data.advance_scope === 'JOB_ORDER') {
        if (!data.job_order_id) {
          throw new Error('Job Order ID is required for JOB_ORDER scope');
        }
        finalOperationId = null;
        finalJobOrderId = data.job_order_id;
      } else if (data.advance_scope === 'GENERAL') {
        finalJobOrderId = null;
        finalOperationId = null;
      } else {
        throw new Error('Invalid advance_scope');
      }

      const advanceNo = await this.generateCashAdvanceNumber(connection, data.request_date);

      const query = `
        INSERT INTO cash_advances (
          advance_no, advance_scope, job_order_id, operation_id,
          driver_id, user_id, amount, currency, purpose, request_date,
          status, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)
      `;
      
      const params = [
        advanceNo,
        data.advance_scope,
        finalJobOrderId,
        finalOperationId,
        data.driver_id || null,
        data.user_id || null,
        data.amount,
        data.currency || 'IDR',
        data.purpose,
        data.request_date,
        data.notes || null,
        userId
      ];

      const [result] = await connection.query(query, params);
      
      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findById(id) {
    const query = `
      SELECT 
        ca.*,
        jo.job_order_number,
        op.operation_no,
        dr.driver_name,
        usr.name as user_name,
        creator.name as creator_name,
        disburser.name as disbursed_by_name,
        s.id as settlement_id,
        s.status as settlement_status
      FROM cash_advances ca
      LEFT JOIN job_orders jo ON ca.job_order_id = jo.id
      LEFT JOIN operations op ON ca.operation_id = op.id
      LEFT JOIN drivers dr ON ca.driver_id = dr.id
      LEFT JOIN users usr ON ca.user_id = usr.id
      LEFT JOIN users creator ON ca.created_by = creator.id
      LEFT JOIN users disburser ON ca.disbursed_by = disburser.id
      LEFT JOIN settlements s ON ca.id = s.cash_advance_id
      WHERE ca.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async findAll(filters) {
    let query = `
      SELECT 
        ca.*,
        jo.job_order_number,
        op.operation_no,
        dr.driver_name,
        usr.name as user_name,
        creator.name as creator_name,
        disburser.name as disbursed_by_name
      FROM cash_advances ca
      LEFT JOIN job_orders jo ON ca.job_order_id = jo.id
      LEFT JOIN operations op ON ca.operation_id = op.id
      LEFT JOIN drivers dr ON ca.driver_id = dr.id
      LEFT JOIN users usr ON ca.user_id = usr.id
      LEFT JOIN users creator ON ca.created_by = creator.id
      LEFT JOIN users disburser ON ca.disbursed_by = disburser.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.advance_scope) {
      query += ` AND ca.advance_scope = ?`;
      params.push(filters.advance_scope);
    }
    if (filters.status) {
      query += ` AND ca.status = ?`;
      params.push(filters.status);
    }
    if (filters.job_order_id) {
      query += ` AND ca.job_order_id = ?`;
      params.push(filters.job_order_id);
    }
    if (filters.operation_id) {
      query += ` AND ca.operation_id = ?`;
      params.push(filters.operation_id);
    }
    if (filters.driver_id) {
      query += ` AND ca.driver_id = ?`;
      params.push(filters.driver_id);
    }
    if (filters.user_id) {
      query += ` AND ca.user_id = ?`;
      params.push(filters.user_id);
    }
    if (filters.search) {
      query += ` AND (
        ca.advance_no LIKE ? OR
        ca.purpose LIKE ? OR
        jo.job_order_number LIKE ? OR
        op.operation_no LIKE ? OR
        dr.driver_name LIKE ? OR
        usr.name LIKE ?
      )`;
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY ca.created_at DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async update(id, data) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [existing] = await connection.query('SELECT status FROM cash_advances WHERE id = ? FOR UPDATE', [id]);
      if (existing.length === 0) {
        throw new Error('Cash Advance not found');
      }
      if (existing[0].status !== 'DRAFT' && existing[0].status !== 'REJECTED') {
        throw new Error('Hanya Cash Advance berstatus DRAFT atau REJECTED yang dapat diubah');
      }

      let finalJobOrderId = data.job_order_id || null;
      let finalOperationId = data.operation_id || null;

      if (data.advance_scope === 'OPERATION') {
        if (!data.operation_id) {
          throw new Error('Operation ID is required for OPERATION scope');
        }
        const [opRows] = await connection.query('SELECT job_order_id FROM operations WHERE id = ?', [data.operation_id]);
        if (opRows.length === 0) {
          throw new Error('Invalid Operation ID');
        }
        finalOperationId = data.operation_id;
        finalJobOrderId = opRows[0].job_order_id;
      } else if (data.advance_scope === 'JOB_ORDER') {
        if (!data.job_order_id) {
          throw new Error('Job Order ID is required for JOB_ORDER scope');
        }
        finalOperationId = null;
        finalJobOrderId = data.job_order_id;
      } else if (data.advance_scope === 'GENERAL') {
        finalJobOrderId = null;
        finalOperationId = null;
      }

      const query = `
        UPDATE cash_advances SET
          advance_scope = ?, job_order_id = ?, operation_id = ?,
          driver_id = ?, user_id = ?, amount = ?, currency = ?,
          purpose = ?, request_date = ?, notes = ?, status = 'DRAFT',
          rejection_reason = NULL
        WHERE id = ? AND (status = 'DRAFT' OR status = 'REJECTED')
      `;
      
      const params = [
        data.advance_scope,
        finalJobOrderId,
        finalOperationId,
        data.driver_id || null,
        data.user_id || null,
        data.amount,
        data.currency || 'IDR',
        data.purpose,
        data.request_date,
        data.notes || null,
        id
      ];

      const [result] = await connection.query(query, params);
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async submit(id) {
    const query = `UPDATE cash_advances SET status = 'SUBMITTED' WHERE id = ? AND status = 'DRAFT'`;
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0;
  }

  static async approve(id, userId) {
    const query = `
      UPDATE cash_advances 
      SET status = 'APPROVED', approved_by = ?, approved_at = NOW() 
      WHERE id = ? AND status = 'SUBMITTED'
    `;
    const [result] = await db.query(query, [userId, id]);
    return result.affectedRows > 0;
  }

  static async reject(id, userId, rejectionReason) {
    const query = `
      UPDATE cash_advances 
      SET status = 'REJECTED', rejection_reason = ? 
      WHERE id = ? AND status = 'SUBMITTED'
    `;
    const [result] = await db.query(query, [rejectionReason, id]);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const query = `DELETE FROM cash_advances WHERE id = ? AND (status = 'DRAFT' OR status = 'REJECTED')`;
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = CashAdvanceModel;
