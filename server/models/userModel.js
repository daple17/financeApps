const db = require('../config/db');

class UserModel {
  /**
   * Find User by Email (includes Role & Permissions)
   * @param {string} email 
   */
  static async findByEmail(email) {
    const query = `
      SELECT 
        u.id, u.name, u.email, u.password_hash, u.is_active, u.created_at,
        r.id AS role_id, r.name AS role_name, r.permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
      LIMIT 1
    `;
    const [rows] = await db.query(query, [email]);
    if (rows.length === 0) return null;

    const user = rows[0];
    let parsedPermissions = [];
    try {
      parsedPermissions = typeof user.permissions === 'string' 
        ? JSON.parse(user.permissions) 
        : (user.permissions || []);
    } catch (e) {
      parsedPermissions = [];
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password_hash: user.password_hash,
      is_active: Boolean(user.is_active),
      created_at: user.created_at,
      role: {
        id: user.role_id,
        name: user.role_name,
        permissions: parsedPermissions
      }
    };
  }

  /**
   * Find User by ID
   * @param {number} id 
   */
  static async findById(id) {
    const query = `
      SELECT 
        u.id, u.name, u.email, u.is_active, u.created_at,
        r.id AS role_id, r.name AS role_name, r.permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
      LIMIT 1
    `;
    const [rows] = await db.query(query, [id]);
    if (rows.length === 0) return null;

    const user = rows[0];
    let parsedPermissions = [];
    try {
      parsedPermissions = typeof user.permissions === 'string' 
        ? JSON.parse(user.permissions) 
        : (user.permissions || []);
    } catch (e) {
      parsedPermissions = [];
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      is_active: Boolean(user.is_active),
      created_at: user.created_at,
      role: {
        id: user.role_id,
        name: user.role_name,
        permissions: parsedPermissions
      }
    };
  }

  /**
   * Insert audit log entry into audit_logs table
   */
  static async logAudit({ userId, action, entityType, entityId, details, ipAddress }) {
    const query = `
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await db.query(query, [
      userId || null,
      action,
      entityType,
      entityId || null,
      JSON.stringify(details || {}),
      ipAddress || null
    ]);
  }
}

module.exports = UserModel;
