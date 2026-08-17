const VendorPaymentService = require('../services/vendorPaymentService');

class VendorPaymentController {
  static async preview(req, res, next) {
    try {
      const { invoiceId, cashAccountId } = req.body;
      if (!invoiceId || !cashAccountId) {
        return res.status(400).json({ error: "invoiceId dan cashAccountId wajib diisi" });
      }

      const preview = await VendorPaymentService.previewPayment(invoiceId, cashAccountId);
      res.json(preview);
    } catch (error) {
      if (error.statusCode === 409) return res.status(409).json({ error: error.message });
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { invoiceId, cashAccountId, paymentDate, notes } = req.body;
      const userId = req.user.id;

      if (!invoiceId || !cashAccountId || !paymentDate) {
        return res.status(400).json({ error: "invoiceId, cashAccountId, dan paymentDate wajib diisi" });
      }

      const result = await VendorPaymentService.createPayment({
        invoiceId,
        cashAccountId,
        paymentDate,
        notes
      }, userId);

      res.status(201).json({
        message: "Vendor Payment berhasil diposting",
        data: result
      });
    } catch (error) {
      if (error.statusCode === 409) return res.status(409).json({ error: error.message });
      next(error);
    }
  }

  static async getPayments(req, res, next) {
    try {
      const filters = {
        vendor_id: req.query.vendor_id
      };
      const payments = await VendorPaymentService.getPayments(filters);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentById(req, res, next) {
    try {
      const payment = await VendorPaymentService.getPaymentById(req.params.id);
      if (!payment) return res.status(404).json({ error: "Payment tidak ditemukan" });
      res.json(payment);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = VendorPaymentController;
