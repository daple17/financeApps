const db = require('../../config/db');

class DriverModel {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM drivers WHERE 1=1';
    const params = [];

    if (filters.search) {
      query += ' AND (driver_code LIKE ? OR driver_name LIKE ? OR phone_number LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.availability) {
      query += ' AND availability = ?';
      params.push(filters.availability);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM drivers WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const query = `
      INSERT INTO drivers (
        driver_code, driver_name, phone_number, license_number, 
        license_type, license_expiry_date, employment_type, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.driver_code,
      data.driver_name,
      data.phone_number || null,
      data.license_number || null,
      data.license_type || null,
      data.license_expiry_date || null,
      data.employment_type || 'INTERNAL',
      data.status || 'ACTIVE',
      data.notes || null,
      data.created_by
    ];

    const [result] = await db.query(query, params);
    return result.insertId;
  }

  static async update(id, data, updatedBy) {
    const query = `
      UPDATE drivers SET
        driver_code = ?,
        driver_name = ?,
        phone_number = ?,
        license_number = ?,
        license_type = ?,
        license_expiry_date = ?,
        employment_type = ?,
        status = ?,
        notes = ?,
        updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.driver_code,
      data.driver_name,
      data.phone_number || null,
      data.license_number || null,
      data.license_type || null,
      data.license_expiry_date || null,
      data.employment_type || 'INTERNAL',
      data.status || 'ACTIVE',
      data.notes || null,
      updatedBy,
      id
    ];

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
  }
}

module.exports = DriverModel;
