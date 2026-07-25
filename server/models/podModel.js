const db = require('../config/db');
const OperationModel = require('./operationModel');

class PodModel {
  static async getLatestByOperation(operationId) {
    const [rows] = await db.query(`
      SELECT p.*, 
        s.name as submitted_by_name,
        v.name as verified_by_name,
        r.name as rejected_by_name
      FROM operation_pods p
      LEFT JOIN users s ON p.submitted_by = s.id
      LEFT JOIN users v ON p.verified_by = v.id
      LEFT JOIN users r ON p.rejected_by = r.id
      WHERE p.operation_id = ?
      ORDER BY p.id DESC
      LIMIT 1
    `, [operationId]);
    return rows.length ? rows[0] : null;
  }

  static async submitPod(data) {
    const [result] = await db.query(`
      INSERT INTO operation_pods (
        operation_id, recipient_name, recipient_company, recipient_phone,
        delivery_date, delivery_time, delivery_notes, received_condition,
        status, submitted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)
    `, [
      data.operation_id, data.recipient_name, data.recipient_company || null, data.recipient_phone || null,
      data.delivery_date, data.delivery_time, data.delivery_notes || null, data.received_condition,
      data.submitted_by
    ]);

    await OperationModel.logEvent(
      db, data.operation_id, 'POD_SUBMITTED', data.submitted_by,
      `POD submitted for recipient: ${data.recipient_name}`
    );

    return result.insertId;
  }

  static async verifyPod(id, operationId, userId) {
    await db.query(`
      UPDATE operation_pods 
      SET status = 'VERIFIED', verified_by = ?, verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [userId, id]);

    await OperationModel.logEvent(
      db, operationId, 'POD_VERIFIED', userId,
      `POD verified successfully`
    );
    return true;
  }

  static async rejectPod(id, operationId, userId, reason) {
    await db.query(`
      UPDATE operation_pods 
      SET status = 'REJECTED', rejected_by = ?, rejected_at = CURRENT_TIMESTAMP, rejection_reason = ?
      WHERE id = ?
    `, [userId, reason, id]);

    await OperationModel.logEvent(
      db, operationId, 'POD_REJECTED', userId,
      `POD rejected: ${reason}`
    );
    return true;
  }
}

module.exports = PodModel;
