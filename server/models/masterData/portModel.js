const db = require('../../config/db');

class PortModel {
  static async findAll({ search, status, country_id, port_type, trade_scope }) {
    let query = `
      SELECT p.*, c.country_name 
      FROM ports p
      LEFT JOIN countries c ON p.country_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }
    if (country_id) {
      query += ` AND p.country_id = ?`;
      params.push(country_id);
    }
    if (port_type) {
      query += ` AND p.port_type = ?`;
      params.push(port_type);
    }
    if (trade_scope) {
      query += ` AND p.trade_scope = ?`;
      params.push(trade_scope);
    }

    if (search) {
      query += ` AND (p.port_code LIKE ? OR p.port_name LIKE ? OR p.city LIKE ? OR p.un_locode LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    query += ` ORDER BY p.port_name ASC`;
    const [rows] = await db.query(query, params);
    return rows;
  }

  static async findById(id) {
    const query = `
      SELECT p.*, c.country_name 
      FROM ports p
      LEFT JOIN countries c ON p.country_id = c.id
      WHERE p.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  }

  static async create(data, userId) {
    const query = `
      INSERT INTO ports (
        port_code, port_name, port_type, trade_scope, country_id, city, un_locode, address, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      data.port_code, data.port_name, data.port_type, data.trade_scope, data.country_id,
      data.city || null, data.un_locode || null, data.address || null, data.status || 'ACTIVE',
      userId, userId
    ]);
    return result.insertId;
  }

  static async update(id, data, userId) {
    const query = `
      UPDATE ports SET
        port_code = ?, port_name = ?, port_type = ?, trade_scope = ?, country_id = ?, 
        city = ?, un_locode = ?, address = ?, status = ?, updated_by = ?
      WHERE id = ?
    `;
    await db.query(query, [
      data.port_code, data.port_name, data.port_type, data.trade_scope, data.country_id,
      data.city || null, data.un_locode || null, data.address || null, data.status || 'ACTIVE',
      userId, id
    ]);
  }
}

module.exports = PortModel;
