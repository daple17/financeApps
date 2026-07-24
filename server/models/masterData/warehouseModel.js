const db = require('../../config/db');

class WarehouseModel {
  static async findAll({ search, status, country_id, warehouse_type, city }) {
    let query = `
      SELECT w.*, c.country_name, bp.partner_name as business_partner_name
      FROM warehouses w
      LEFT JOIN countries c ON w.country_id = c.id
      LEFT JOIN business_partners bp ON w.business_partner_id = bp.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND w.status = ?`;
      params.push(status);
    }
    if (country_id) {
      query += ` AND w.country_id = ?`;
      params.push(country_id);
    }
    if (warehouse_type) {
      query += ` AND w.warehouse_type = ?`;
      params.push(warehouse_type);
    }
    if (city) {
      query += ` AND w.city = ?`;
      params.push(city);
    }

    if (search) {
      query += ` AND (w.warehouse_code LIKE ? OR w.warehouse_name LIKE ? OR w.city LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ` ORDER BY w.warehouse_name ASC`;
    const [rows] = await db.query(query, params);
    return rows;
  }

  static async findById(id) {
    const query = `
      SELECT w.*, c.country_name, bp.partner_name as business_partner_name
      FROM warehouses w
      LEFT JOIN countries c ON w.country_id = c.id
      LEFT JOIN business_partners bp ON w.business_partner_id = bp.id
      WHERE w.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  }

  static async create(data, userId) {
    const query = `
      INSERT INTO warehouses (
        warehouse_code, warehouse_name, warehouse_type, country_id, city, address, 
        contact_person, phone, email, business_partner_id, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      data.warehouse_code, data.warehouse_name, data.warehouse_type, data.country_id,
      data.city || null, data.address || null, data.contact_person || null,
      data.phone || null, data.email || null, data.business_partner_id || null,
      data.status || 'ACTIVE', userId, userId
    ]);
    return result.insertId;
  }

  static async update(id, data, userId) {
    const query = `
      UPDATE warehouses SET
        warehouse_code = ?, warehouse_name = ?, warehouse_type = ?, country_id = ?, 
        city = ?, address = ?, contact_person = ?, phone = ?, email = ?, 
        business_partner_id = ?, status = ?, updated_by = ?
      WHERE id = ?
    `;
    await db.query(query, [
      data.warehouse_code, data.warehouse_name, data.warehouse_type, data.country_id,
      data.city || null, data.address || null, data.contact_person || null,
      data.phone || null, data.email || null, data.business_partner_id || null,
      data.status || 'ACTIVE', userId, id
    ]);
  }
}

module.exports = WarehouseModel;
