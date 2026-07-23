const AuthService = require('../services/authService');

class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const result = await AuthService.login(email, password, ipAddress);

      res.status(200).json({
        status: 'success',
        message: 'Login berhasil',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  static async me(req, res, next) {
    try {
      const user = await AuthService.getProfile(req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Profil pengguna berhasil dimuat',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh-token
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Token baru berhasil diperbarui',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  static async logout(req, res, next) {
    try {
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      await AuthService.logout(req.user.id, ipAddress);

      res.status(200).json({
        status: 'success',
        message: 'Logout berhasil'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
