const CostTypeMappingModel = require('../models/costTypeMappingModel');
const CoaModel = require('../models/coaModel');

class CostTypeMappingController {
  static async getAll(req, res) {
    try {
      const mappings = await CostTypeMappingModel.getAll();
      res.json({ status: 'success', data: mappings });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Gagal mengambil data mapping' });
    }
  }

  static async create(req, res) {
    try {
      const { cost_type, account_id, is_active } = req.body;
      const userId = req.user.id; // From auth middleware

      if (!cost_type || !account_id) {
        return res.status(400).json({ status: 'error', message: 'cost_type and account_id are required' });
      }

      // Check account validity
      const account = await CoaModel.findById(account_id);
      if (!account) {
        return res.status(400).json({ status: 'error', message: 'Account tidak ditemukan' });
      }
      if (account.is_active !== 1 && account.is_active !== true) {
        return res.status(400).json({ status: 'error', message: 'Account tidak aktif' });
      }
      if (account.type !== 'EXPENSE') {
        return res.status(400).json({ status: 'error', message: 'Account harus bertipe EXPENSE. Ditolak.' });
      }

      // Check conflict
      const existing = await CostTypeMappingModel.findByCostType(cost_type);
      if (existing) {
        return res.status(409).json({ status: 'error', message: 'Mapping untuk cost_type ini sudah ada' });
      }

      const insertId = await CostTypeMappingModel.create({ cost_type, account_id, is_active }, userId);
      res.status(201).json({ status: 'success', data: { id: insertId } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Gagal menyimpan mapping' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { cost_type, account_id, is_active } = req.body;

      const mapping = await CostTypeMappingModel.findById(id);
      if (!mapping) {
        return res.status(404).json({ status: 'error', message: 'Mapping tidak ditemukan' });
      }

      if (account_id && account_id !== mapping.account_id) {
        const account = await CoaModel.findById(account_id);
        if (!account) return res.status(400).json({ status: 'error', message: 'Account tidak ditemukan' });
        if (account.is_active !== 1 && account.is_active !== true) return res.status(400).json({ status: 'error', message: 'Account tidak aktif' });
        if (account.type !== 'EXPENSE') return res.status(400).json({ status: 'error', message: 'Account harus bertipe EXPENSE' });
      }

      if (cost_type && cost_type !== mapping.cost_type) {
        const existing = await CostTypeMappingModel.findByCostType(cost_type);
        if (existing) {
          return res.status(409).json({ status: 'error', message: 'Mapping untuk cost_type tersebut sudah ada' });
        }
      }

      await CostTypeMappingModel.update(id, { cost_type, account_id, is_active });
      res.json({ status: 'success', message: 'Mapping berhasil diperbarui' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Gagal memperbarui mapping' });
    }
  }
}

module.exports = CostTypeMappingController;
