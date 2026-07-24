const db = require('../../config/db');

const LogisticsReferenceModel = {
  // --- VEHICLE TYPES ---
  getAllVehicleTypes: async (filters = {}) => {
    let query = 'SELECT * FROM vehicle_types WHERE 1=1';
    const params = [];

    if (filters.search) {
      query += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY name ASC';
    const [rows] = await db.query(query, params);
    return rows;
  },

  getVehicleTypeById: async (id) => {
    const [rows] = await db.query('SELECT * FROM vehicle_types WHERE id = ?', [id]);
    return rows[0];
  },

  createVehicleType: async (data) => {
    const { code, name, description, capacity_weight_kg, capacity_volume_cbm, status } = data;
    const [result] = await db.query(
      `INSERT INTO vehicle_types (code, name, description, capacity_weight_kg, capacity_volume_cbm, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [code, name, description, capacity_weight_kg || null, capacity_volume_cbm || null, status || 'ACTIVE']
    );
    return result.insertId;
  },

  updateVehicleType: async (id, data) => {
    const { code, name, description, capacity_weight_kg, capacity_volume_cbm, status } = data;
    await db.query(
      `UPDATE vehicle_types 
       SET code = ?, name = ?, description = ?, capacity_weight_kg = ?, capacity_volume_cbm = ?, status = ?
       WHERE id = ?`,
      [code, name, description, capacity_weight_kg || null, capacity_volume_cbm || null, status, id]
    );
    return true;
  },

  // --- CONTAINER TYPES ---
  getAllContainerTypes: async (filters = {}) => {
    let query = 'SELECT * FROM container_types WHERE 1=1';
    const params = [];

    if (filters.search) {
      query += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY size_ft ASC, name ASC';
    const [rows] = await db.query(query, params);
    return rows;
  },

  getContainerTypeById: async (id) => {
    const [rows] = await db.query('SELECT * FROM container_types WHERE id = ?', [id]);
    return rows[0];
  },

  createContainerType: async (data) => {
    const { code, name, size_ft, category, description, status } = data;
    const [result] = await db.query(
      `INSERT INTO container_types (code, name, size_ft, category, description, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [code, name, size_ft || null, category || null, description, status || 'ACTIVE']
    );
    return result.insertId;
  },

  updateContainerType: async (id, data) => {
    const { code, name, size_ft, category, description, status } = data;
    await db.query(
      `UPDATE container_types 
       SET code = ?, name = ?, size_ft = ?, category = ?, description = ?, status = ?
       WHERE id = ?`,
      [code, name, size_ft || null, category || null, description, status, id]
    );
    return true;
  },

  // --- CARGO UNITS ---
  getAllCargoUnits: async (filters = {}) => {
    let query = 'SELECT * FROM cargo_units WHERE 1=1';
    const params = [];

    if (filters.search) {
      query += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY name ASC';
    const [rows] = await db.query(query, params);
    return rows;
  },

  getCargoUnitById: async (id) => {
    const [rows] = await db.query('SELECT * FROM cargo_units WHERE id = ?', [id]);
    return rows[0];
  },

  createCargoUnit: async (data) => {
    const { code, name, description, status } = data;
    const [result] = await db.query(
      `INSERT INTO cargo_units (code, name, description, status) 
       VALUES (?, ?, ?, ?)`,
      [code, name, description, status || 'ACTIVE']
    );
    return result.insertId;
  },

  updateCargoUnit: async (id, data) => {
    const { code, name, description, status } = data;
    await db.query(
      `UPDATE cargo_units 
       SET code = ?, name = ?, description = ?, status = ?
       WHERE id = ?`,
      [code, name, description, status, id]
    );
    return true;
  },

  // --- SERVICE TYPES ---
  getAllServiceTypes: async (filters = {}) => {
    let query = `
      SELECT st.*, 
             GROUP_CONCAT(stjt.job_order_type) as applicable_job_types
      FROM service_types st
      LEFT JOIN service_type_job_types stjt ON st.id = stjt.service_type_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      query += ' AND (st.name LIKE ? OR st.code LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.status) {
      query += ' AND st.status = ?';
      params.push(filters.status);
    }

    if (filters.job_order_type) {
      query += ' AND stjt.job_order_type = ?';
      params.push(filters.job_order_type);
    }

    query += ' GROUP BY st.id ORDER BY st.name ASC';
    const [rows] = await db.query(query, params);
    
    // Parse the comma-separated string back to array for the client
    return rows.map(r => ({
      ...r,
      applicable_job_types: r.applicable_job_types ? r.applicable_job_types.split(',') : []
    }));
  },

  getServiceTypeById: async (id) => {
    const query = `
      SELECT st.*, 
             GROUP_CONCAT(stjt.job_order_type) as applicable_job_types
      FROM service_types st
      LEFT JOIN service_type_job_types stjt ON st.id = stjt.service_type_id
      WHERE st.id = ?
      GROUP BY st.id
    `;
    const [rows] = await db.query(query, [id]);
    if (rows[0]) {
      rows[0].applicable_job_types = rows[0].applicable_job_types ? rows[0].applicable_job_types.split(',') : [];
    }
    return rows[0];
  },

  createServiceType: async (data) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { code, name, description, status, applicable_job_types } = data;
      
      const [result] = await connection.query(
        `INSERT INTO service_types (code, name, description, status) 
         VALUES (?, ?, ?, ?)`,
        [code, name, description, status || 'ACTIVE']
      );
      
      const newId = result.insertId;

      if (applicable_job_types && Array.isArray(applicable_job_types) && applicable_job_types.length > 0) {
        const values = applicable_job_types.map(jobType => [newId, jobType]);
        await connection.query(
          `INSERT INTO service_type_job_types (service_type_id, job_order_type) VALUES ?`,
          [values]
        );
      }

      await connection.commit();
      return newId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  updateServiceType: async (id, data) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { code, name, description, status, applicable_job_types } = data;
      
      await connection.query(
        `UPDATE service_types 
         SET code = ?, name = ?, description = ?, status = ?
         WHERE id = ?`,
        [code, name, description, status, id]
      );
      
      // Update relationships by deleting and recreating
      await connection.query(`DELETE FROM service_type_job_types WHERE service_type_id = ?`, [id]);

      if (applicable_job_types && Array.isArray(applicable_job_types) && applicable_job_types.length > 0) {
        const values = applicable_job_types.map(jobType => [id, jobType]);
        await connection.query(
          `INSERT INTO service_type_job_types (service_type_id, job_order_type) VALUES ?`,
          [values]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = LogisticsReferenceModel;
