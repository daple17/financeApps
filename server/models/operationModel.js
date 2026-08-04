const db = require('../config/db');
const JobOrderModel = require('./jobOrderModel');

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

      await conn.beginTransaction();

      const [joRows] = await conn.query('SELECT job_status FROM job_orders WHERE id = ?', [data.job_order_id]);
      if (joRows.length === 0) {
        throw new Error('Job Order not found');
      }
      const joStatus = joRows[0].job_status;
      if (['DRAFT', 'COMPLETED', 'CANCELLED', 'CLOSED'].includes(joStatus)) {
        throw new Error('Job Order must be Confirmed or In Progress before an Operation can be created.');
      }

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

      // Trigger Job Order Rollup
      await JobOrderModel.syncStatusFromOperations(data.job_order_id);

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
      if (filters.status.includes(',')) {
        const statuses = filters.status.split(',').map(s => s.trim());
        const placeholders = statuses.map(() => '?').join(',');
        query += ` AND o.status IN (${placeholders})`;
        params.push(...statuses);
      } else {
        query += ` AND o.status = ?`;
        params.push(filters.status);
      }
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

  static async updateStatus(id, status, updatedBy, notes = null, cancellationReason = null) {
    const conn = await db.getConnection();
    let jobOrderId = null;
    try {
      await conn.beginTransaction();
      
      const [oldRows] = await conn.query('SELECT job_order_id, status FROM operations WHERE id = ?', [id]);
      if (oldRows.length === 0) {
        throw new Error('Operation not found');
      }
      const oldStatus = oldRows[0].status;
      jobOrderId = oldRows[0].job_order_id;

      // Validate Transition Rules
      const validTransitions = {
        'PLANNING': ['READY', 'CANCELLED'],
        'READY': ['STARTED', 'CANCELLED'],
        'STARTED': ['ARRIVED_PICKUP'],
        'ARRIVED_PICKUP': ['PICKED_UP'],
        'PICKED_UP': ['IN_TRANSIT'],
        'IN_TRANSIT': ['ARRIVED_DESTINATION'],
        'ARRIVED_DESTINATION': ['DELIVERED'],
        'DELIVERED': ['COMPLETED']
      };

      if (oldStatus !== status) {
        const allowed = validTransitions[oldStatus] || [];
        if (!allowed.includes(status)) {
          throw new Error(`Invalid status transition from ${oldStatus} to ${status}`);
        }
      }

      // Ready validation
      if (status === 'READY') {
        const [assignments] = await conn.query(
          `SELECT id FROM operation_resource_assignments WHERE operation_id = ? AND status = 'ASSIGNED'`,
          [id]
        );
        if (assignments.length === 0) {
          throw new Error('Driver and Vehicle must be assigned before this Operation can be marked Ready.');
        }
      }

      // POD validation for COMPLETED
      if (status === 'COMPLETED') {
        const [pods] = await conn.query(
          `SELECT status FROM operation_pods WHERE operation_id = ? ORDER BY id DESC LIMIT 1`,
          [id]
        );
        if (pods.length === 0 || !['SUBMITTED', 'VERIFIED'].includes(pods[0].status)) {
          throw new Error('Operation belum dapat diselesaikan karena Proof of Delivery belum disubmit.');
        }
      }

      // Build update query
      let updateFields = ['status = ?', 'updated_by = ?'];
      let updateValues = [status, updatedBy];

      switch (status) {
        case 'STARTED':
          updateFields.push('actual_start_at = CURRENT_TIMESTAMP');
          break;
        case 'ARRIVED_PICKUP':
          updateFields.push('arrived_pickup_at = CURRENT_TIMESTAMP');
          break;
        case 'PICKED_UP':
          updateFields.push('picked_up_at = CURRENT_TIMESTAMP');
          break;
        case 'IN_TRANSIT':
          updateFields.push('in_transit_at = CURRENT_TIMESTAMP');
          break;
        case 'ARRIVED_DESTINATION':
          updateFields.push('arrived_destination_at = CURRENT_TIMESTAMP');
          break;
        case 'DELIVERED':
          updateFields.push('delivered_at = CURRENT_TIMESTAMP');
          break;
        case 'COMPLETED':
          updateFields.push('actual_completion_at = CURRENT_TIMESTAMP');
          break;
        case 'CANCELLED':
          if (!cancellationReason) {
            throw new Error('Cancellation Reason is required');
          }
          updateFields.push('cancelled_at = CURRENT_TIMESTAMP', 'cancelled_by = ?', 'cancellation_reason = ?');
          updateValues.push(updatedBy, cancellationReason);
          break;
      }

      updateValues.push(id);

      await conn.query(
        `UPDATE operations SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // Handle COMPLETED or CANCELLED: release resources
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        const [assignments] = await conn.query(
          `SELECT id, driver_id, vehicle_id FROM operation_resource_assignments WHERE operation_id = ? AND status = 'ASSIGNED'`,
          [id]
        );
        if (assignments.length > 0) {
          const assignment = assignments[0];
          await conn.query(
            `UPDATE operation_resource_assignments SET status = 'RELEASED', released_at = CURRENT_TIMESTAMP, released_by = ? WHERE id = ?`,
            [updatedBy, assignment.id]
          );
          await conn.query(`UPDATE drivers SET availability = 'AVAILABLE' WHERE id = ?`, [assignment.driver_id]);
          await conn.query(`UPDATE vehicles SET status = 'AVAILABLE' WHERE id = ?`, [assignment.vehicle_id]);
          await this.logEvent(conn, id, 'RESOURCE_RELEASED', updatedBy, `Released due to ${status}`);
        }
      }

      await this.logEvent(
        conn,
        id,
        status === 'CANCELLED' ? 'CANCELLED' : 'STATUS_CHANGED',
        updatedBy,
        notes || (cancellationReason ? `Cancelled: ${cancellationReason}` : `Status changed from ${oldStatus} to ${status}`),
        oldStatus,
        status
      );

      await conn.commit();

      // Trigger Job Order Rollup
      if (jobOrderId) {
        await JobOrderModel.syncStatusFromOperations(jobOrderId);
      }

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

  static async getAssignment(operationId) {
    const query = `
      SELECT a.*, 
             d.driver_name, d.phone_number, d.license_type,
             v.plate_number, v.capacity_weight, v.capacity_volume, v.ownership_type,
             vt.name as vehicle_type_name
      FROM operation_resource_assignments a
      JOIN drivers d ON a.driver_id = d.id
      JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
      WHERE a.operation_id = ? AND a.status = 'ASSIGNED'
      ORDER BY a.assigned_at DESC LIMIT 1
    `;
    const [rows] = await db.query(query, [operationId]);
    return rows[0] || null;
  }

  static async assignResource(operationId, driverId, vehicleId, assignedBy) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [opRows] = await conn.query('SELECT status FROM operations WHERE id = ?', [operationId]);
      if (opRows.length === 0) throw new Error('Operation not found.');
      if (!['PLANNING', 'READY'].includes(opRows[0].status)) {
        throw new Error('Resource can only be assigned during Planning or Ready status.');
      }

      // Ensure no existing active assignment for this operation
      const [existing] = await conn.query(
        `SELECT id FROM operation_resource_assignments WHERE operation_id = ? AND status = 'ASSIGNED'`,
        [operationId]
      );
      if (existing.length > 0) {
        throw new Error('Operation already has an active assignment.');
      }

      // Ensure vehicle is not assigned to another active operation
      const [vehicleCheck] = await conn.query(
        `SELECT a.id FROM operation_resource_assignments a
         JOIN operations o ON a.operation_id = o.id
         WHERE a.vehicle_id = ? AND a.status = 'ASSIGNED' AND o.status NOT IN ('COMPLETED', 'CANCELLED')`,
        [vehicleId]
      );
      if (vehicleCheck.length > 0) {
        throw new Error('Vehicle is currently assigned to another active operation.');
      }

      // Ensure driver is not assigned to another active operation
      const [driverCheck] = await conn.query(
        `SELECT a.id FROM operation_resource_assignments a
         JOIN operations o ON a.operation_id = o.id
         WHERE a.driver_id = ? AND a.status = 'ASSIGNED' AND o.status NOT IN ('COMPLETED', 'CANCELLED')`,
        [driverId]
      );
      if (driverCheck.length > 0) {
        throw new Error('Driver is currently assigned to another active operation.');
      }

      // Assign resource
      await conn.query(
        `INSERT INTO operation_resource_assignments (operation_id, driver_id, vehicle_id, assigned_by) 
         VALUES (?, ?, ?, ?)`,
        [operationId, driverId, vehicleId, assignedBy]
      );

      // Update statuses
      await conn.query(`UPDATE drivers SET availability = 'ASSIGNED' WHERE id = ?`, [driverId]);
      await conn.query(`UPDATE vehicles SET status = 'ASSIGNED' WHERE id = ?`, [vehicleId]);

      await this.logEvent(conn, operationId, 'RESOURCE_ASSIGNED', assignedBy, `Assigned Driver ID: ${driverId}, Vehicle ID: ${vehicleId}`);

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  static async releaseResource(operationId, releasedBy) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [opRows] = await conn.query('SELECT status FROM operations WHERE id = ?', [operationId]);
      if (opRows.length > 0 && !['PLANNING', 'READY'].includes(opRows[0].status)) {
        throw new Error('Resource can only be released during Planning or Ready status.');
      }

      const [assignments] = await conn.query(
        `SELECT id, driver_id, vehicle_id FROM operation_resource_assignments 
         WHERE operation_id = ? AND status = 'ASSIGNED'`,
        [operationId]
      );

      if (assignments.length === 0) {
        throw new Error('No active assignment found for this operation.');
      }

      const assignment = assignments[0];

      await conn.query(
        `UPDATE operation_resource_assignments 
         SET status = 'RELEASED', released_at = CURRENT_TIMESTAMP, released_by = ? 
         WHERE id = ?`,
        [releasedBy, assignment.id]
      );

      await conn.query(`UPDATE drivers SET availability = 'AVAILABLE' WHERE id = ?`, [assignment.driver_id]);
      await conn.query(`UPDATE vehicles SET status = 'AVAILABLE' WHERE id = ? AND status = 'ASSIGNED'`, [assignment.vehicle_id]);

      await this.logEvent(conn, operationId, 'RESOURCE_RELEASED', releasedBy, `Released Driver ID: ${assignment.driver_id}, Vehicle ID: ${assignment.vehicle_id}`);

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}

module.exports = OperationModel;
