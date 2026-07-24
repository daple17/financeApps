const db = require('../../config/db');

class CountryModel {
  static async findAll({ search, status }) {
    let query = `SELECT * FROM countries WHERE 1=1`;
    const params = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (country_code LIKE ? OR country_name LIKE ? OR iso2 LIKE ? OR iso3 LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    query += ` ORDER BY country_name ASC`;
    const [rows] = await db.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`SELECT * FROM countries WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  static async create(data, userId) {
    const query = `
      INSERT INTO countries (
        country_code, country_name, iso2, iso3, phone_code, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      data.country_code, data.country_name, data.iso2 || null, data.iso3 || null,
      data.phone_code || null, data.status || 'ACTIVE', userId, userId
    ]);
    return result.insertId;
  }

  static async update(id, data, userId) {
    const query = `
      UPDATE countries SET
        country_code = ?, country_name = ?, iso2 = ?, iso3 = ?, phone_code = ?, status = ?, updated_by = ?
      WHERE id = ?
    `;
    await db.query(query, [
      data.country_code, data.country_name, data.iso2 || null, data.iso3 || null,
      data.phone_code || null, data.status || 'ACTIVE', userId, id
    ]);
  }
}

module.exports = CountryModel;
