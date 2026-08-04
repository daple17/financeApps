const SettlementModel = require('../models/settlementModel');
const SettlementService = require('../services/settlementService');
const CashAdvanceModel = require('../models/cashAdvanceModel'); 
const AuditLogModel = require('../models/auditLogModel');
const TransactionModel = require('../models/transactionModel');

class SettlementController {
  static async getAll(req, res) {
    try {
      const filters = {
        status: req.query.status,
        search: req.query.search
      };
      const settlements = await SettlementModel.findAll(filters);
      res.json({ status: 'success', data: settlements });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Gagal mengambil data settlement' });
    }
  }

  static async getEligibleAdvances(req, res) {
    try {
      const advances = await SettlementModel.getEligibleAdvances();
      res.json({ status: 'success', data: advances });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Gagal mengambil eligible advances' });
    }
  }

  static async createDraft(req, res) {
    try {
      const { cash_advance_id } = req.body;
      const userId = req.user.id;

      if (!cash_advance_id) {
        return res.status(400).json({ status: 'error', message: 'cash_advance_id is required' });
      }

      const insertId = await SettlementService.createDraft(cash_advance_id, userId);
      res.status(201).json({ status: 'success', data: { id: insertId } });
    } catch (error) {
      if (error.message.startsWith('Conflict:')) {
        return res.status(409).json({ status: 'error', message: error.message });
      }
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const settlement = await SettlementModel.findById(id);
      if (!settlement) {
        return res.status(404).json({ status: 'error', message: 'Settlement tidak ditemukan' });
      }
      const items = await SettlementModel.getItems(id);
      settlement.items = items;
      
      const timeline = await AuditLogModel.getEntityTimeline('SETTLEMENT', id);
      settlement.timeline = timeline;
      
      if (settlement.transaction_id) {
        settlement.finance_transaction = await TransactionModel.findById(settlement.transaction_id);
      }

      res.json({ status: 'success', data: settlement });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Gagal mengambil data settlement' });
    }
  }

  static async revise(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      await SettlementService.revise(id, userId);
      res.json({ status: 'success', message: 'Settlement direvisi (kembali ke DRAFT)' });
    } catch (error) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      // Note: protected fields are NOT extracted here.
      // We only allow specific fields to be updated manually by the client (like notes).
      const { notes } = req.body;
      
      const settlement = await SettlementModel.findById(id);
      if (!settlement) return res.status(404).json({ status: 'error', message: 'Settlement tidak ditemukan' });
      
      if (settlement.status !== 'DRAFT') {
        return res.status(409).json({ status: 'error', message: 'Hanya Settlement berstatus DRAFT yang dapat diubah' });
      }

      // Update allows only safe fields
      const updated = await SettlementModel.update(id, { notes });
      res.json({ status: 'success', message: 'Settlement updated' });
    } catch (error) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const settlement = await SettlementModel.findById(id);
      if (settlement && settlement.status === 'POSTED') {
        return res.status(409).json({ status: 'error', message: 'Settlement yang sudah diposting tidak dapat dihapus' });
      }
      const affected = await SettlementModel.delete(id);
      if (affected === 0) {
        return res.status(409).json({ status: 'error', message: 'Gagal menghapus. Pastikan berstatus DRAFT' });
      }
      res.json({ status: 'success', message: 'Settlement dihapus' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Gagal menghapus settlement' });
    }
  }

  static async getEligibleCosts(req, res) {
    try {
      const { id } = req.params;
      const settlement = await SettlementModel.findById(id);
      if (!settlement) {
        return res.status(404).json({ status: 'error', message: 'Settlement tidak ditemukan' });
      }
      
      const eligibleCosts = await SettlementModel.getEligibleCostsForSettlement(settlement);
      res.json({ status: 'success', data: eligibleCosts });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Gagal mengambil eligible costs' });
    }
  }

  static async addItem(req, res) {
    try {
      const { id } = req.params;
      const { operation_cost_id } = req.body;
      const userId = req.user.id;

      if (!operation_cost_id) {
        return res.status(400).json({ status: 'error', message: 'operation_cost_id is required' });
      }

      await SettlementService.addItem(id, operation_cost_id, userId);
      res.json({ status: 'success', message: 'Item berhasil ditambahkan' });
    } catch (error) {
      if (error.message.startsWith('Conflict:')) {
        return res.status(409).json({ status: 'error', message: error.message });
      }
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async removeItem(req, res) {
    try {
      const { id, itemId } = req.params;
      const userId = req.user.id;

      const affected = await SettlementService.removeItem(id, itemId, userId);
      if (affected === 0) {
        return res.status(404).json({ status: 'error', message: 'Item tidak ditemukan atau settlement bukan DRAFT' });
      }
      res.json({ status: 'success', message: 'Item dihapus' });
    } catch (error) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async submit(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      await SettlementService.submit(id, userId);
      res.json({ status: 'success', message: 'Settlement berhasil di-submit' });
    } catch (error) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
  static async postingPreview(req, res) {
    try {
      const { id } = req.params;
      const { cash_account_id } = req.body;
      const preview = await SettlementService.postingPreview(id, cash_account_id);
      res.json({ status: 'success', data: preview });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ status: 'error', message: error.message });
      }
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async post(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const transactionId = await SettlementService.post(id, userId, req.body);
      res.json({ status: 'success', message: 'Settlement berhasil diposting', data: { transaction_id: transactionId } });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ status: 'error', message: error.message });
      }
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
}
module.exports = SettlementController;
