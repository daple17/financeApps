const CoaModel = require('../models/coaModel');
const UserModel = require('../models/userModel');

class CoaService {
  static async getAllAccounts() {
    const accounts = await CoaModel.getAll();
    
    // Build tree structure if needed or return flat list
    return accounts;
  }

  static async getAccountById(id) {
    const account = await CoaModel.findById(id);
    if (!account) {
      const error = new Error('Akun tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
    return account;
  }

  static async createAccount(data, userId) {
    const { code, name, type, category } = data;
    if (!code || !name || !type || !category) {
      const error = new Error('Kode, nama, tipe, dan kategori akun wajib diisi');
      error.statusCode = 400;
      throw error;
    }

    const existing = await CoaModel.findByCode(code);
    if (existing) {
      const error = new Error(`Kode akun ${code} sudah digunakan`);
      error.statusCode = 409;
      throw error;
    }

    const accountId = await CoaModel.create(data);

    await UserModel.logAudit({
      userId,
      action: 'COA_CREATE',
      entityType: 'ACCOUNT',
      entityId: accountId,
      details: { code, name, type }
    });

    return await CoaModel.findById(accountId);
  }

  static async updateAccount(id, data, userId) {
    const account = await CoaModel.findById(id);
    if (!account) {
      const error = new Error('Akun tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }

    if (data.code && data.code !== account.code) {
      const existing = await CoaModel.findByCode(data.code);
      if (existing) {
        const error = new Error(`Kode akun ${data.code} sudah digunakan`);
        error.statusCode = 409;
        throw error;
      }
    }

    await CoaModel.update(id, { ...account, ...data });

    await UserModel.logAudit({
      userId,
      action: 'COA_UPDATE',
      entityType: 'ACCOUNT',
      entityId: id,
      details: data
    });

    return await CoaModel.findById(id);
  }

  static async deleteAccount(id, userId) {
    const account = await CoaModel.findById(id);
    if (!account) {
      const error = new Error('Akun tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }

    const isUsed = await CoaModel.isUsedInTransactions(id);
    if (isUsed) {
      const error = new Error('Akun tidak dapat dihapus karena telah digunakan dalam transaksi jurnal');
      error.statusCode = 400;
      throw error;
    }

    await CoaModel.delete(id);

    await UserModel.logAudit({
      userId,
      action: 'COA_DELETE',
      entityType: 'ACCOUNT',
      entityId: id,
      details: { code: account.code, name: account.name }
    });

    return true;
  }
}

module.exports = CoaService;
