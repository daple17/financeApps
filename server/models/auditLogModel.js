const db = require('../config/db');

class AuditLogModel {
  /**
   * Retrieves chronological timeline of events for a specific entity
   * @param {string} entityType - e.g., 'CASH_ADVANCE' or 'SETTLEMENT'
   * @param {number} entityId 
   */
  static async getEntityTimeline(entityType, entityId) {
    const query = `
      SELECT 
        a.id,
        a.action,
        a.details,
        a.created_at,
        u.name AS user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.entity_type = ? AND a.entity_id = ?
      ORDER BY a.created_at ASC, a.id ASC
    `;
    const [rows] = await db.query(query, [entityType, entityId]);
    return rows.map(row => {
      let parsedDetails = {};
      try {
        parsedDetails = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
      } catch (e) {
        parsedDetails = {};
      }
      return {
        id: row.id,
        action: row.action,
        actor: row.user_name || 'System',
        timestamp: row.created_at,
        details: parsedDetails
      };
    });
  }

  static async create(data, connection) {
    const conn = connection || db;
    const query = `
      INSERT INTO audit_logs (entity_type, entity_id, action, user_id, details)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      data.entity_type,
      data.entity_id,
      data.action,
      data.user_id || null,
      data.details ? JSON.stringify(data.details) : null
    ];
    const [result] = await conn.query(query, params);
    return result.insertId;
  }
}

module.exports = AuditLogModel;
