const db = require('../config/db');

exports.getAllRoles = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM roles ORDER BY id ASC');
    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM roles WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Role tidak ditemukan'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.createRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;
    
    // Validasi
    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Nama role wajib diisi' });
    }

    // Insert
    const permissionsJson = permissions ? JSON.stringify(permissions) : '[]';
    const [result] = await db.query(
      'INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)',
      [name, description, permissionsJson]
    );

    // Audit Log
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'CREATE_ROLE', 'ROLES', result.insertId, JSON.stringify({ name, permissions })]
    );

    res.status(201).json({
      status: 'success',
      message: 'Role berhasil dibuat',
      data: { id: result.insertId }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'Nama role sudah digunakan' });
    }
    next(error);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const [roleRows] = await db.query('SELECT * FROM roles WHERE id = ?', [id]);
    if (roleRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Role tidak ditemukan' });
    }

    const permissionsJson = permissions ? JSON.stringify(permissions) : '[]';
    
    await db.query(
      'UPDATE roles SET name = ?, description = ?, permissions = ? WHERE id = ?',
      [name, description, permissionsJson, id]
    );

    // Audit Log
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'UPDATE_ROLE', 'ROLES', id, JSON.stringify({ name, permissions })]
    );

    res.status(200).json({
      status: 'success',
      message: 'Role berhasil diperbarui'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'Nama role sudah digunakan' });
    }
    next(error);
  }
};

exports.deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Cegah hapus role yang sedang dipakai
    const [usersWithRole] = await db.query('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [id]);
    if (usersWithRole[0].count > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Role ini tidak dapat dihapus karena masih digunakan oleh satu atau lebih pengguna.' 
      });
    }

    const [result] = await db.query('DELETE FROM roles WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Role tidak ditemukan' });
    }

    // Audit Log
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'DELETE_ROLE', 'ROLES', id, JSON.stringify({ role_id: id })]
    );

    res.status(200).json({
      status: 'success',
      message: 'Role berhasil dihapus'
    });
  } catch (error) {
    next(error);
  }
};
