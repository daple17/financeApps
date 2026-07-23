const CoaService = require('../services/coaService');

class CoaController {
  static async getAll(req, res, next) {
    try {
      const accounts = await CoaService.getAllAccounts();
      res.status(200).json({
        status: 'success',
        message: 'Daftar Chart of Accounts berhasil dimuat',
        data: accounts
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const account = await CoaService.getAccountById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: account
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const account = await CoaService.createAccount(req.body, req.user.id);
      res.status(201).json({
        status: 'success',
        message: 'Akun baru berhasil dibuat',
        data: account
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const account = await CoaService.updateAccount(req.params.id, req.body, req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Akun berhasil diperbarui',
        data: account
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      await CoaService.deleteAccount(req.params.id, req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Akun berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CoaController;
