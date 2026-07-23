const UserModel = require('../models/userModel');
const { comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

class AuthService {
  /**
   * Process User Login
   * @param {string} email 
   * @param {string} password 
   * @param {string} ipAddress 
   */
  static async login(email, password, ipAddress) {
    if (!email || !password) {
      const error = new Error('Email dan password wajib diisi');
      error.statusCode = 400;
      throw error;
    }

    // 1. Fetch user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const error = new Error('Email atau password tidak terdaftar');
      error.statusCode = 401;
      throw error;
    }

    // 2. Check if active
    if (!user.is_active) {
      const error = new Error('Akun Anda nonaktif. Silakan hubungi Administrator');
      error.statusCode = 403;
      throw error;
    }

    // 3. Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      const error = new Error('Email atau password tidak valid');
      error.statusCode = 401;
      throw error;
    }

    // 4. Generate JWT payload & tokens
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ id: user.id });

    // 5. Record Audit Log
    await UserModel.logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'AUTH',
      entityId: user.id,
      details: { email: user.email, role: user.role.name },
      ipAddress
    });

    // 6. Return response payload
    const { password_hash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  }

  /**
   * Fetch User Profile
   * @param {number} userId 
   */
  static async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error('Pengguna tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  /**
   * Refresh Token
   * @param {string} token 
   */
  static async refreshToken(token) {
    if (!token) {
      const error = new Error('Refresh token diperlukan');
      error.statusCode = 400;
      throw error;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      const error = new Error('Refresh token tidak valid atau telah kedaluwarsa');
      error.statusCode = 401;
      throw error;
    }

    const user = await UserModel.findById(decoded.id);
    if (!user || !user.is_active) {
      const error = new Error('Pengguna tidak ditemukan atau nonaktif');
      error.statusCode = 401;
      throw error;
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const newAccessToken = generateAccessToken(payload);
    return { accessToken: newAccessToken };
  }

  /**
   * Process User Logout (Audit Log Record)
   * @param {number} userId 
   * @param {string} ipAddress 
   */
  static async logout(userId, ipAddress) {
    await UserModel.logAudit({
      userId,
      action: 'USER_LOGOUT',
      entityType: 'AUTH',
      entityId: userId,
      details: { status: 'SUCCESS' },
      ipAddress
    });
    return true;
  }
}

module.exports = AuthService;
