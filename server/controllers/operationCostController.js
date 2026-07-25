const OperationCostModel = require('../models/operationCostModel');
const OperationModel = require('../models/operationModel');
const BusinessPartnerModel = require('../models/masterData/businessPartnerModel');

const operationCostController = {
  createOperationCost: async (req, res) => {
    try {
      const { operationId } = req.params;
      const { cost_type, description, amount, transaction_date, vendor_id, reference_no, notes } = req.body;
      const userId = req.user.id;

      if (!cost_type || !description || amount === undefined || !transaction_date) {
        return res.status(400).json({ status: 'error', message: 'cost_type, description, amount, dan transaction_date wajib diisi' });
      }

      if (amount <= 0) {
        return res.status(400).json({ status: 'error', message: 'Amount harus lebih dari 0' });
      }

      const operation = await OperationModel.findById(operationId);
      if (!operation) {
        return res.status(404).json({ status: 'error', message: 'Operation tidak ditemukan' });
      }

      if (vendor_id) {
        const vendor = await BusinessPartnerModel.findById(vendor_id);
        if (!vendor) {
          return res.status(404).json({ status: 'error', message: 'Vendor tidak valid' });
        }
      }

      const costData = {
        operation_id: operationId,
        job_order_id: operation.job_order_id,
        cost_type,
        description,
        amount,
        transaction_date,
        vendor_id,
        reference_no,
        notes,
        status: 'DRAFT'
      };

      const costId = await OperationCostModel.create(costData, userId);
      res.status(201).json({ status: 'success', data: { id: costId }, message: 'Biaya operasional berhasil ditambahkan' });

    } catch (error) {
      console.error('[OperationCostController] createOperationCost error:', error);
      res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal server' });
    }
  },

  getOperationCosts: async (req, res) => {
    try {
      const { operationId } = req.params;
      const operation = await OperationModel.findById(operationId);
      if (!operation) {
        return res.status(404).json({ status: 'error', message: 'Operation tidak ditemukan' });
      }

      const costs = await OperationCostModel.findByOperationId(operationId);
      res.json({ status: 'success', data: costs });
    } catch (error) {
      console.error('[OperationCostController] getOperationCosts error:', error);
      res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal server' });
    }
  },

  getOperationCostById: async (req, res) => {
    try {
      const { id } = req.params;
      const cost = await OperationCostModel.findById(id);
      
      if (!cost) {
        return res.status(404).json({ status: 'error', message: 'Biaya operasional tidak ditemukan' });
      }
      
      res.json({ status: 'success', data: cost });
    } catch (error) {
      console.error('[OperationCostController] getOperationCostById error:', error);
      res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal server' });
    }
  },

  updateOperationCost: async (req, res) => {
    try {
      const { id } = req.params;
      const { cost_type, description, amount, transaction_date, vendor_id, reference_no, notes } = req.body;
      
      if (!cost_type || !description || amount === undefined || !transaction_date) {
        return res.status(400).json({ status: 'error', message: 'cost_type, description, amount, dan transaction_date wajib diisi' });
      }

      if (amount <= 0) {
        return res.status(400).json({ status: 'error', message: 'Amount harus lebih dari 0' });
      }

      const existingCost = await OperationCostModel.findById(id);
      if (!existingCost) {
        return res.status(404).json({ status: 'error', message: 'Biaya operasional tidak ditemukan' });
      }

      if (!['DRAFT', 'SUBMITTED'].includes(existingCost.status)) {
        return res.status(400).json({ status: 'error', message: 'Hanya cost dengan status DRAFT atau SUBMITTED yang dapat diubah' });
      }

      if (vendor_id && vendor_id !== existingCost.vendor_id) {
        const vendor = await BusinessPartnerModel.findById(vendor_id);
        if (!vendor) {
          return res.status(404).json({ status: 'error', message: 'Vendor tidak valid' });
        }
      }

      const updateData = {
        cost_type, description, amount, transaction_date, vendor_id, reference_no, notes
      };

      const success = await OperationCostModel.update(id, updateData);
      if (!success) {
        return res.status(400).json({ status: 'error', message: 'Gagal memperbarui biaya operasional' });
      }

      res.json({ status: 'success', message: 'Biaya operasional berhasil diperbarui' });
    } catch (error) {
      console.error('[OperationCostController] updateOperationCost error:', error);
      res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal server' });
    }
  },

  updateOperationCostStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const validStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ status: 'error', message: 'Status tidak valid' });
      }

      const existingCost = await OperationCostModel.findById(id);
      if (!existingCost) {
        return res.status(404).json({ status: 'error', message: 'Biaya operasional tidak ditemukan' });
      }

      if (existingCost.status === 'POSTED') {
        return res.status(400).json({ status: 'error', message: 'Cost yang sudah POSTED tidak dapat diubah statusnya' });
      }

      // TODO in phase 3.5.x: when status === 'POSTED', create transaction and journal entry.

      const success = await OperationCostModel.updateStatus(id, status, userId);
      if (!success) {
        return res.status(400).json({ status: 'error', message: 'Gagal mengubah status biaya operasional' });
      }

      res.json({ status: 'success', message: 'Status berhasil diperbarui' });
    } catch (error) {
      console.error('[OperationCostController] updateOperationCostStatus error:', error);
      res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal server' });
    }
  },

  deleteOperationCost: async (req, res) => {
    try {
      const { id } = req.params;
      
      const existingCost = await OperationCostModel.findById(id);
      if (!existingCost) {
        return res.status(404).json({ status: 'error', message: 'Biaya operasional tidak ditemukan' });
      }

      if (existingCost.status !== 'DRAFT') {
        return res.status(400).json({ status: 'error', message: 'Hanya cost dengan status DRAFT yang dapat dihapus' });
      }

      const success = await OperationCostModel.delete(id);
      if (!success) {
        return res.status(400).json({ status: 'error', message: 'Gagal menghapus biaya operasional' });
      }

      res.json({ status: 'success', message: 'Biaya operasional berhasil dihapus' });
    } catch (error) {
      console.error('[OperationCostController] deleteOperationCost error:', error);
      res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal server' });
    }
  }
};

module.exports = operationCostController;
