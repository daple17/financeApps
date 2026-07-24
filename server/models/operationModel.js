const db = require('../config/db');

class OperationModel {
  static async generateOperationNumber(connection) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `OP-${year}${month}-`;

    const [rows] = await connection.query(
      `SELECT operation_no FROM operations 
       WHERE operation_no LIKE ? 
       ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );

    let nextNumber = 1;
    if (rows.length > 0) {
      const lastNo = rows[0].operation_no;
      const lastSeq = parseInt(lastNo.split('-')[2]);
      if (!isNaN(lastSeq)) {
        nextNumber = lastSeq + 1;
      }
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  static async logEvent(connection, operationId, eventType, performedBy, notes = null, oldValue = null, newValue = null) {
    await connection.query(
      `INSERT INTO operation_events (operation_id, event_type, performed_by, notes, old_value, new_value)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [operationId, eventType, performedBy, notes, oldValue, newValue]
    );
  }

  static async create(data) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const operationNo = await this.generateOperationNumber(conn);

      const [result] = await conn.query(
        `INSERT INTO operations (
          operation_no, job_order_id, operation_date, planned_start, planned_completion,
          operational_pic_id, priority, status, execution_quantity, execution_unit, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          operationNo,
          data.job_order_id,
          data.operation_date,
          data.planned_start || null,
          data.planned_completion || null,
          data.operational_pic_id || null,
          data.priority || 'NORMAL',
          data.status || 'PLANNING',
          data.execution_quantity || null,
          data.execution_unit || null,
          data.notes || null,
          data.created_by
        ]
      );

      const operationId = result.insertId;

      await this.logEvent(
        conn,
        operationId,
        'CREATED',
        data.created_by,
        `Operation ${operationNo} created.`
      );

      await conn.commit();
      return operationId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT o.*,
             j.job_order_number, j.job_order_type, j.customer_id, j.pickup_location, j.delivery_location,
             u.name as pic_name,
             c.partner_name as customer_name
      FROM operations o
      JOIN job_orders j ON o.job_order_id = j.id
      LEFT JOIN users u ON o.operational_pic_id = u.id
      LEFT JOIN business_partners c ON j.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ` AND o.status = ?`;
      params.push(filters.status);
    }
    if (filters.job_order_type) {
      query += ` AND j.job_order_type = ?`;
      params.push(filters.job_order_type);
    }
    if (filters.search) {
      query += ` AND (o.operation_no LIKE ? OR j.job_order_number LIKE ? OR c.partner_name LIKE ? OR j.pickup_location LIKE ? OR j.delivery_location LIKE ?)`;
      const searchStr = `%${filters.search}%`;
      params.push(searchStr, searchStr, searchStr, searchStr, searchStr);
    }

    query += ` ORDER BY o.created_at DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT o.*,
              j.job_order_number, j.job_order_type, j.customer_id, j.pickup_location, j.delivery_location, j.service_type, j.cargo_unit, j.cargo_quantity, j.vehicle_type_requirement,
              u.name as pic_name,
              c.partner_name as customer_name,
              NULL as customer_pic_name
       FROM operations o
       JOIN job_orders j ON o.job_order_id = j.id
       LEFT JOIN users u ON o.operational_pic_id = u.id
       LEFT JOIN business_partners c ON j.customer_id = c.id
       WHERE o.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByJobOrderId(jobOrderId) {
    const [rows] = await db.query(
      `SELECT o.*, u.name as pic_name
       FROM operations o
       LEFT JOIN users u ON o.operational_pic_id = u.id
       WHERE o.job_order_id = ?
       ORDER BY o.created_at DESC`,
      [jobOrderId]
    );
    return rows;
  }

  static async getEvents(operationId) {
    const [rows] = await db.query(
      `SELECT e.*, u.name as user_name
       FROM operation_events e
       LEFT JOIN users u ON e.performed_by = u.id
       WHERE e.operation_id = ?
       ORDER BY e.event_time DESC`,
      [operationId]
    );
    return rows;
  }

  static async update(id, data, updatedBy) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE operations SET
          operation_date = ?,
          planned_start = ?,
          planned_completion = ?,
          operational_pic_id = ?,
          priority = ?,
          execution_quantity = ?,
          execution_unit = ?,
          notes = ?,
          updated_by = ?
         WHERE id = ?`,
        [
          data.operation_date,
          data.planned_start || null,
          data.planned_completion || null,
          data.operational_pic_id || null,
          data.priority,
          data.execution_quantity || null,
          data.execution_unit || null,
          data.notes || null,
          updatedBy,
          id
        ]
      );

      await this.logEvent(
        conn,
        id,
        'UPDATED',
        updatedBy,
        'Operation details updated.'
      );

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  static async updateStatus(id, status, updatedBy, notes = null) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      
      const [oldRows] = await conn.query('SELECT status FROM operations WHERE id = ?', [id]);
      const oldStatus = oldRows[0]?.status;

      await conn.query(
        `UPDATE operations SET status = ?, updated_by = ? WHERE id = ?`,
        [status, updatedBy, id]
      );

      await this.logEvent(
        conn,
        id,
        'STATUS_CHANGED',
        updatedBy,
        notes || `Status changed from ${oldStatus} to ${status}`,
        oldStatus,
        status
      );

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
  static async getOperationBalance(jobOrderId) {
    const [jobRows] = await db.query(
      `SELECT job_order_type, cargo_quantity, cargo_unit, vehicle_quantity, vehicle_type_requirement
       FROM job_orders WHERE id = ?`,
      [jobOrderId]
    );

    if (jobRows.length === 0) return null;
    const job = jobRows[0];

    // Determine target unit and ordered quantity
    let unit = 'UNIT';
    let ordered = 0;

    if (job.job_order_type === 'TRUCKING') {
      unit = job.vehicle_type_requirement || 'TRUCK';
      ordered = job.vehicle_quantity || 1;
    } else {
      // Fallback to cargo quantity and unit for Export/Import/Project
      unit = job.cargo_unit || 'UNIT';
      ordered = job.cargo_quantity || 0;
    }

    // Get allocated sum
    const [opRows] = await db.query(
      `SELECT SUM(execution_quantity) as allocated 
       FROM operations 
       WHERE job_order_id = ? AND status != 'CANCELLED'`,
      [jobOrderId]
    );

    const allocated = parseFloat(opRows[0].allocated) || 0;
    const remaining = ordered - allocated;

    return {
      ordered: parseFloat(ordered) || 0,
      allocated,
      remaining: remaining > 0 ? remaining : 0,
      unit
    };
  }
}

module.exports = OperationModel;
