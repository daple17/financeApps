const CashAdvanceModel = require('../models/cashAdvanceModel');
const UserModel = require('../models/userModel');
const CoaModel = require('../models/coaModel');
const CashAdvanceService = require('../services/cashAdvanceService');
const AuditLogModel = require('../models/auditLogModel');
const TransactionModel = require('../models/transactionModel');

class CashAdvanceController {
  
  static _validatePayload(reqBody) {
    const { advance_scope, driver_id, user_id, amount } = reqBody;

    // Reject protected fields
    const protectedFields = [
      'approved_by', 'approved_at', 'disbursed_by', 
      'disbursed_at', 'transaction_id', 'status'
    ];
    for (const field of protectedFields) {
      if (reqBody[field] !== undefined) {
        throw new Error(`Field ${field} tidak dapat diisi secara manual`);
      }
    }

    if (!amount || Number(amount) <= 0) {
      throw new Error('Nominal (amount) harus lebih besar dari 0');
    }

    // Recipient exactly one
    if (!driver_id && !user_id) {
      throw new Error('Penerima (Driver atau User) harus diisi');
    }
    if (driver_id && user_id) {
      throw new Error('Penerima tidak boleh diisi keduanya (Driver dan User)');
    }

    // GENERAL scope logic
    if (advance_scope === 'GENERAL') {
      if (driver_id) {
        throw new Error('Cash Advance GENERAL tidak dapat diberikan kepada Driver (driver_id harus kosong)');
      }
      if (!user_id) {
        throw new Error('Cash Advance GENERAL harus ditujukan kepada User internal (user_id wajib diisi)');
      }
    }
  }

  static async create(req, res) {
    try {
      CashAdvanceController._validatePayload(req.body);

      const insertId = await CashAdvanceModel.create(req.body, req.user.id);
      const newAdvance = await CashAdvanceModel.findById(insertId);

      await UserModel.logAudit({
        userId: req.user.id,
        action: 'CASH_ADVANCE_CREATED',
        entityType: 'CASH_ADVANCE',
        entityId: insertId,
        details: { advance_no: newAdvance.advance_no }
      });

      res.status(201).json({
        status: 'success',
        message: 'Cash Advance berhasil dibuat (DRAFT)',
        data: newAdvance
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Gagal membuat Cash Advance'
      });
    }
  }

  static async getAll(req, res) {
    try {
      const filters = {
        advance_scope: req.query.advance_scope,
        status: req.query.status,
        job_order_id: req.query.job_order_id,
        operation_id: req.query.operation_id,
        driver_id: req.query.driver_id,
        user_id: req.query.user_id,
        search: req.query.search
      };
      const advances = await CashAdvanceModel.findAll(filters);
      res.json({
        status: 'success',
        data: advances
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil data Cash Advance'
      });
    }
  }

  static async getById(req, res) {
    try {
      const advance = await CashAdvanceModel.findById(req.params.id);
      if (!advance) {
        return res.status(404).json({
          status: 'error',
          message: 'Cash Advance tidak ditemukan'
        });
      }
      
      const timeline = await AuditLogModel.getEntityTimeline('CASH_ADVANCE', req.params.id);
      advance.timeline = timeline;
      
      if (advance.transaction_id) {
        advance.finance_transaction = await TransactionModel.findById(advance.transaction_id);
      }

      res.json({
        status: 'success',
        data: advance
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil detail Cash Advance'
      });
    }
  }

  static async update(req, res) {
    try {
      CashAdvanceController._validatePayload(req.body);

      const advance = await CashAdvanceModel.findById(req.params.id);
      if (!advance) {
        return res.status(404).json({
          status: 'error',
          message: 'Cash Advance tidak ditemukan'
        });
      }
      
      if (advance.status === 'DISBURSED' || advance.status === 'SETTLED') {
        return res.status(409).json({ status: 'error', message: 'Cash Advance yang sudah dicairkan tidak dapat diupdate' });
      }

      const success = await CashAdvanceModel.update(req.params.id, req.body);
      if (!success) {
        return res.status(409).json({
          status: 'error',
          message: 'Gagal mengupdate Cash Advance, pastikan status adalah DRAFT'
        });
      }

      await UserModel.logAudit({
        userId: req.user.id,
        action: 'CASH_ADVANCE_UPDATED',
        entityType: 'CASH_ADVANCE',
        entityId: req.params.id,
        details: { advance_no: advance.advance_no }
      });

      const updated = await CashAdvanceModel.findById(req.params.id);
      res.json({
        status: 'success',
        message: 'Cash Advance berhasil diupdate',
        data: updated
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Gagal mengupdate Cash Advance'
      });
    }
  }

  static async submit(req, res) {
    try {
      const advance = await CashAdvanceModel.findById(req.params.id);
      if (!advance) {
        return res.status(404).json({
          status: 'error',
          message: 'Cash Advance tidak ditemukan'
        });
      }
      
      if (advance.status !== 'DRAFT') {
        return res.status(409).json({
          status: 'error',
          message: 'Hanya Cash Advance berstatus DRAFT yang dapat di-submit'
        });
      }

      const success = await CashAdvanceModel.submit(req.params.id);
      if (!success) {
        return res.status(400).json({
          status: 'error',
          message: 'Gagal men-submit Cash Advance'
        });
      }

      await UserModel.logAudit({
        userId: req.user.id,
        action: 'CASH_ADVANCE_SUBMITTED',
        entityType: 'CASH_ADVANCE',
        entityId: req.params.id,
        details: { advance_no: advance.advance_no }
      });

      const updated = await CashAdvanceModel.findById(req.params.id);
      res.json({
        status: 'success',
        message: 'Cash Advance berhasil di-submit (SUBMITTED)',
        data: updated
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Gagal men-submit Cash Advance'
      });
    }
  }

  static async delete(req, res) {
    try {
      const advance = await CashAdvanceModel.findById(req.params.id);
      if (!advance) {
        return res.status(404).json({
          status: 'error',
          message: 'Cash Advance tidak ditemukan'
        });
      }
      
      if (advance.status === 'DISBURSED' || advance.status === 'SETTLED') {
        return res.status(409).json({ status: 'error', message: 'Cash Advance yang sudah dicairkan tidak dapat dihapus' });
      }

      const success = await CashAdvanceModel.delete(req.params.id);
      if (!success) {
        return res.status(409).json({
          status: 'error',
          message: 'Gagal menghapus Cash Advance, pastikan status adalah DRAFT'
        });
      }

      await UserModel.logAudit({
        userId: req.user.id,
        action: 'CASH_ADVANCE_DELETED',
        entityType: 'CASH_ADVANCE',
        entityId: req.params.id,
        details: { advance_no: advance.advance_no }
      });

      res.json({
        status: 'success',
        message: 'Cash Advance berhasil dihapus'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Gagal menghapus Cash Advance'
      });
    }
  }

  static async getEligibleSourceAccounts(req, res) {
    try {
      const accounts = await CoaModel.findEligibleCashBankAccounts();
      res.json({
        status: 'success',
        data: accounts
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil data akun sumber (Kas/Bank)'
      });
    }
  }

  static async disburse(req, res) {
    try {
      const result = await CashAdvanceService.disburse(req.params.id, req.body, req.user.id);
      res.json({
        status: 'success',
        message: 'Pencairan Cash Advance berhasil',
        data: { transaction_id: result.transactionId }
      });
    } catch (error) {
      if (error.message.includes('sudah dicairkan sebelumnya') || error.message.includes('Status saat ini')) {
        return res.status(409).json({ status: 'error', message: error.message });
      }
      res.status(400).json({
        status: 'error',
        message: error.message || 'Gagal melakukan pencairan Cash Advance'
      });
    }
  }
}

module.exports = CashAdvanceController;
