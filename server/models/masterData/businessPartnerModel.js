const db = require('../../config/db');

class BusinessPartnerModel {
  /**
   * Find all Business Partners (with optional role, search, and status filters)
   */
  static async findAll({ role, search, status }) {
    let query = `
      SELECT bp.*, 
             GROUP_CONCAT(DISTINCT bpr.role) as roles
      FROM business_partners bp
      LEFT JOIN business_partner_roles bpr ON bp.id = bpr.partner_id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND bp.id IN (SELECT partner_id FROM business_partner_roles WHERE role = ?)`;
      params.push(role);
    }

    if (status) {
      query += ` AND bp.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (bp.partner_code LIKE ? OR bp.partner_name LIKE ? OR bp.short_name LIKE ? OR bp.city LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    query += ` GROUP BY bp.id ORDER BY bp.partner_name ASC`;

    const [rows] = await db.query(query, params);
    
    // Also fetch contacts to include a preview of primary contact
    if (rows.length > 0) {
      const ids = rows.map(r => r.id);
      const [contacts] = await db.query(
        `SELECT * FROM business_partner_contacts WHERE partner_id IN (?) AND is_primary = TRUE`, 
        [ids]
      );
      
      rows.forEach(row => {
        row.roles = row.roles ? row.roles.split(',') : [];
        row.primary_contact = contacts.find(c => c.partner_id === row.id) || null;
      });
    }

    return rows;
  }

  /**
   * Find Business Partner by ID
   */
  static async findById(id) {
    const query = `
      SELECT bp.*, 
             GROUP_CONCAT(DISTINCT bpr.role) as roles
      FROM business_partners bp
      LEFT JOIN business_partner_roles bpr ON bp.id = bpr.partner_id
      WHERE bp.id = ?
      GROUP BY bp.id
    `;
    const [rows] = await db.query(query, [id]);
    if (rows.length === 0) return null;

    const partner = rows[0];
    partner.roles = partner.roles ? partner.roles.split(',') : [];

    // Fetch all contacts
    const [contacts] = await db.query(
      `SELECT * FROM business_partner_contacts WHERE partner_id = ? ORDER BY is_primary DESC, name ASC`, 
      [id]
    );
    partner.contacts = contacts;

    return partner;
  }

  /**
   * Create Business Partner
   */
  static async create(data, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const insertBpQuery = `
        INSERT INTO business_partners (
          partner_code, partner_name, short_name, partner_type,
          email, phone, city, address, npwp, status, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [bpResult] = await connection.query(insertBpQuery, [
        data.partner_code, data.partner_name, data.short_name || null, data.partner_type || 'COMPANY',
        data.email || null, data.phone || null, data.city || null, data.address || null, data.npwp || null,
        data.status || 'ACTIVE', userId, userId
      ]);

      const partnerId = bpResult.insertId;

      // Insert Roles
      if (data.roles && Array.isArray(data.roles) && data.roles.length > 0) {
        const roleValues = data.roles.map(role => [partnerId, role]);
        await connection.query(
          `INSERT INTO business_partner_roles (partner_id, role) VALUES ?`,
          [roleValues]
        );
      }

      // Insert Contacts
      if (data.contacts && Array.isArray(data.contacts) && data.contacts.length > 0) {
        const contactValues = data.contacts.map(c => [
          partnerId, c.name, c.position || null, c.phone || null, c.email || null, 
          c.is_primary ? 1 : 0, c.status || 'ACTIVE'
        ]);
        await connection.query(
          `INSERT INTO business_partner_contacts (partner_id, name, position, phone, email, is_primary, status) VALUES ?`,
          [contactValues]
        );
      }

      await connection.commit();
      return partnerId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update Business Partner
   */
  static async update(id, data, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const updateBpQuery = `
        UPDATE business_partners SET
          partner_code = ?, partner_name = ?, short_name = ?, partner_type = ?,
          email = ?, phone = ?, city = ?, address = ?, npwp = ?, status = ?,
          updated_by = ?
        WHERE id = ?
      `;
      await connection.query(updateBpQuery, [
        data.partner_code, data.partner_name, data.short_name || null, data.partner_type || 'COMPANY',
        data.email || null, data.phone || null, data.city || null, data.address || null, data.npwp || null,
        data.status || 'ACTIVE', userId, id
      ]);

      // Update Roles (Delete and Re-insert)
      if (data.roles && Array.isArray(data.roles)) {
        await connection.query(`DELETE FROM business_partner_roles WHERE partner_id = ?`, [id]);
        if (data.roles.length > 0) {
          const roleValues = data.roles.map(role => [id, role]);
          await connection.query(
            `INSERT INTO business_partner_roles (partner_id, role) VALUES ?`,
            [roleValues]
          );
        }
      }

      // Update Contacts
      if (data.contacts && Array.isArray(data.contacts)) {
        // Keep track of which contact IDs we want to retain
        const incomingIds = data.contacts.filter(c => c.id).map(c => c.id);
        
        // Delete contacts not in the incoming list
        if (incomingIds.length > 0) {
          await connection.query(`DELETE FROM business_partner_contacts WHERE partner_id = ? AND id NOT IN (?)`, [id, incomingIds]);
        } else {
          await connection.query(`DELETE FROM business_partner_contacts WHERE partner_id = ?`, [id]);
        }

        // Insert or update contacts
        for (const c of data.contacts) {
          if (c.id) {
            await connection.query(
              `UPDATE business_partner_contacts SET name=?, position=?, phone=?, email=?, is_primary=?, status=? WHERE id=? AND partner_id=?`,
              [c.name, c.position || null, c.phone || null, c.email || null, c.is_primary ? 1 : 0, c.status || 'ACTIVE', c.id, id]
            );
          } else {
            await connection.query(
              `INSERT INTO business_partner_contacts (partner_id, name, position, phone, email, is_primary, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [id, c.name, c.position || null, c.phone || null, c.email || null, c.is_primary ? 1 : 0, c.status || 'ACTIVE']
            );
          }
        }
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

  /**
   * Check if partner code exists
   */
  static async codeExists(code, excludeId = null) {
    let query = `SELECT id FROM business_partners WHERE partner_code = ?`;
    const params = [code];
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    const [rows] = await db.query(query, params);
    return rows.length > 0;
  }
}

module.exports = BusinessPartnerModel;
