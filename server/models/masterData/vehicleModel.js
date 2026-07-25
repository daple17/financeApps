const db = require('../../config/db');

class VehicleModel {
  static async findAll(filters = {}) {
    let query = `
      SELECT v.*, vt.name as vehicle_type_name, bp.partner_name as vendor_name 
      FROM vehicles v
      LEFT JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
      LEFT JOIN business_partners bp ON v.vendor_id = bp.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      query += ' AND (v.vehicle_code LIKE ? OR v.plate_number LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.status) {
      query += ' AND v.status = ?';
      params.push(filters.status);
    }
    
    if (filters.vehicle_type_id) {
      query += ' AND v.vehicle_type_id = ?';
      params.push(filters.vehicle_type_id);
    }

    query += ' ORDER BY v.created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async findById(id) {
    const query = `
      SELECT v.*, vt.name as vehicle_type_name, bp.partner_name as vendor_name 
      FROM vehicles v
      LEFT JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
      LEFT JOIN business_partners bp ON v.vendor_id = bp.id
      WHERE v.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0];
  }

  static async create(data) {
    const query = `
      INSERT INTO vehicles (
        vehicle_code, plate_number, vehicle_type_id, ownership_type, 
        vendor_id, capacity_weight, capacity_volume, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.vehicle_code,
      data.plate_number,
      data.vehicle_type_id,
      data.ownership_type || 'COMPANY_OWNED',
      data.vendor_id || null,
      data.capacity_weight || null,
      data.capacity_volume || null,
      data.status || 'AVAILABLE',
      data.notes || null,
      data.created_by
    ];

    const [result] = await db.query(query, params);
    return result.insertId;
  }

  static async update(id, data, updatedBy) {
    const query = `
      UPDATE vehicles SET
        vehicle_code = ?,
        plate_number = ?,
        vehicle_type_id = ?,
        ownership_type = ?,
        vendor_id = ?,
        capacity_weight = ?,
        capacity_volume = ?,
        status = ?,
        notes = ?,
        updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.vehicle_code,
      data.plate_number,
      data.vehicle_type_id,
      data.ownership_type || 'COMPANY_OWNED',
      data.vendor_id || null,
      data.capacity_weight || null,
      data.capacity_volume || null,
      data.status || 'AVAILABLE',
      data.notes || null,
      updatedBy,
      id
    ];

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
  }
}

module.exports = VehicleModel;
