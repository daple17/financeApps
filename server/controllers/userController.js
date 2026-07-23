const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.username, u.name, u.email, u.nip, u.phone_number, u.is_active, u.created_at, r.id as role_id, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      ORDER BY u.id DESC
    `);
    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT u.id, u.username, u.name, u.email, u.nip, u.phone_number, u.is_active, u.created_at, r.id as role_id, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User tidak ditemukan'
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

exports.createUser = async (req, res, next) => {
  try {
    const { username, name, email, password, role_id, nip, phone_number, is_active } = req.body;
    
    if (!username || !email || !password || !role_id) {
      return res.status(400).json({ status: 'error', message: 'Username, Email, Password, dan Role wajib diisi' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    const activeStatus = is_active !== undefined ? is_active : true;

    const [result] = await db.query(
      'INSERT INTO users (username, name, email, nip, phone_number, password_hash, role_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [username, name || username, email, nip || null, phone_number || null, password_hash, role_id, activeStatus]
    );

    // Audit Log
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'CREATE_USER', 'USERS', result.insertId, JSON.stringify({ username, email, role_id })]
    );

    res.status(201).json({
      status: 'success',
      message: 'User berhasil dibuat',
      data: { id: result.insertId }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'Username atau Email sudah digunakan' });
    }
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, name, email, password, role_id, nip, phone_number, is_active } = req.body;

    const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    let query = 'UPDATE users SET username = ?, name = ?, email = ?, nip = ?, phone_number = ?, role_id = ?, is_active = ?';
    let params = [username, name || username, email, nip || null, phone_number || null, role_id, is_active];

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      query += ', password_hash = ?';
      params.push(password_hash);
    }
    
    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);

    // Audit Log
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'UPDATE_USER', 'USERS', id, JSON.stringify({ username, email, role_id, is_active })]
    );

    res.status(200).json({
      status: 'success',
      message: 'User berhasil diperbarui'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'Username atau Email sudah digunakan' });
    }
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Jangan izinkan hapus diri sendiri
    if (parseInt(id) === req.user.id) {
       return res.status(400).json({ status: 'error', message: 'Anda tidak dapat menghapus akun Anda sendiri' });
    }

    // Periksa apakah user memiliki riwayat transaksi/approval
    const [txRows] = await db.query('SELECT COUNT(*) as count FROM transactions WHERE created_by = ? OR approved_by = ?', [id, id]);
    if (txRows[0].count > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'User tidak dapat dihapus karena memiliki riwayat transaksi. Pertimbangkan untuk menonaktifkan akunnya saja (is_active = false).' 
      });
    }

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    // Audit Log
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'DELETE_USER', 'USERS', id, JSON.stringify({ user_id: id })]
    );

    res.status(200).json({
      status: 'success',
      message: 'User berhasil dihapus'
    });
  } catch (error) {
    next(error);
  }
};
