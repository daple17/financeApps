const VendorInvoiceService = require('../services/vendorInvoiceService');

class VendorInvoiceController {
  static async createDraft(req, res) {
    try {
      const invoiceId = await VendorInvoiceService.createDraft(req.body, req.user.id);
      res.status(201).json({ status: 'success', data: { id: invoiceId } });
    } catch (error) {
      if (error.statusCode === 409) {
        res.status(409).json({ status: 'error', message: error.message });
      } else {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
      }
    }
  }

  static async updateDraft(req, res) {
    try {
      await VendorInvoiceService.updateDraft(req.params.id, req.body, req.user.id);
      res.json({ status: 'success', message: 'Vendor Invoice updated' });
    } catch (error) {
      if (error.statusCode === 409) {
        res.status(409).json({ status: 'error', message: error.message });
      } else {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
      }
    }
  }

  static async deleteDraft(req, res) {
    try {
      await VendorInvoiceService.deleteDraft(req.params.id, req.user.id);
      res.json({ status: 'success', message: 'Vendor Invoice deleted' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  static async addItem(req, res) {
    try {
      const { operation_cost_id } = req.body;
      const itemId = await VendorInvoiceService.addItem(req.params.id, operation_cost_id, req.user.id);
      res.status(201).json({ status: 'success', data: { item_id: itemId } });
    } catch (error) {
      if (error.statusCode === 409) {
        res.status(409).json({ status: 'error', message: error.message });
      } else {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
      }
    }
  }

  static async removeItem(req, res) {
    try {
      await VendorInvoiceService.removeItem(req.params.id, req.params.itemId, req.user.id);
      res.json({ status: 'success', message: 'Item removed from Vendor Invoice' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  static async submitInvoice(req, res) {
    try {
      await VendorInvoiceService.submitInvoice(req.params.id, req.user.id);
      res.json({ status: 'success', message: 'Vendor Invoice submitted' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const filters = {
        status: req.query.status,
        vendor_id: req.query.vendor_id,
        search: req.query.search
      };
      const data = await VendorInvoiceService.getAll(filters);
      res.json({ status: 'success', data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Gagal mengambil data Vendor Invoice' });
    }
  }

  static async getById(req, res) {
    try {
      const data = await VendorInvoiceService.getById(req.params.id);
      if (!data) {
        return res.status(404).json({ status: 'error', message: 'Vendor Invoice tidak ditemukan' });
      }
      res.json({ status: 'success', data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Gagal mengambil detail Vendor Invoice' });
    }
  }

  static async getEligibleCosts(req, res) {
    try {
      if (!req.query.vendor_id) {
        return res.status(400).json({ status: 'error', message: 'vendor_id diperlukan' });
      }
      const data = await VendorInvoiceService.getEligibleCosts(req.query.vendor_id);
      res.json({ status: 'success', data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Gagal mengambil Operation Costs yang eligible' });
    }
  }

  static async reviseInvoice(req, res) {
    try {
      await VendorInvoiceService.revise(req.params.id, req.user.id);
      res.json({ status: 'success', message: 'Vendor Invoice dikembalikan ke DRAFT' });
    } catch (error) {
      if (error.statusCode === 409) {
        res.status(409).json({ status: 'error', message: error.message });
      } else {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
      }
    }
  }

  static async getDashboardSummary(req, res) {
    try {
      const data = await VendorInvoiceService.getDashboardSummary();
      res.json({ status: 'success', data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Gagal mengambil data dashboard' });
    }
  }

  // --- PHASE 5.5: LIABILITY POSTING ---

  static async getPostingPreview(req, res) {
    try {
      const data = await VendorInvoiceService.getPostingPreview(req.params.id, req.user.id);
      res.json({ status: 'success', data });
    } catch (error) {
      if (error.statusCode === 409) {
        res.status(409).json({ status: 'error', message: error.message });
      } else {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message || 'Gagal membuat preview posting' });
      }
    }
  }

  static async postLiability(req, res) {
    try {
      const data = await VendorInvoiceService.postLiability(req.params.id, req.user.id);
      res.json({ status: 'success', message: 'Vendor Invoice berhasil diposting', data });
    } catch (error) {
      if (error.statusCode === 409) {
        res.status(409).json({ status: 'error', message: error.message });
      } else {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message || 'Gagal memposting Vendor Invoice' });
      }
    }
  }

}

module.exports = VendorInvoiceController;
