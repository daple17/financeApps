const BusinessPartner = require('../../models/masterData/businessPartnerModel');

class BusinessPartnerController {
  
  static async getAll(req, res) {
    try {
      const { role, search, status } = req.query;
      const partners = await BusinessPartner.findAll({ role, search, status });
      res.json(partners);
    } catch (error) {
      console.error('Error in getAll BusinessPartners:', error);
      res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const partner = await BusinessPartner.findById(id);
      
      if (!partner) {
        return res.status(404).json({ message: 'Business Partner tidak ditemukan' });
      }
      
      res.json(partner);
    } catch (error) {
      console.error('Error in getById BusinessPartner:', error);
      res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
  }

  static async create(req, res) {
    try {
      const data = req.body;
      const userId = req.user.id; // From auth middleware

      if (!data.partner_code || !data.partner_name) {
        return res.status(400).json({ message: 'Partner Code dan Partner Name harus diisi' });
      }

      // Check for duplicate code
      const exists = await BusinessPartner.codeExists(data.partner_code);
      if (exists) {
        return res.status(400).json({ message: 'Partner Code sudah digunakan' });
      }

      const id = await BusinessPartner.create(data, userId);
      res.status(201).json({ message: 'Business Partner berhasil dibuat', id });
    } catch (error) {
      console.error('Error in create BusinessPartner:', error);
      res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const userId = req.user.id; // From auth middleware

      if (!data.partner_code || !data.partner_name) {
        return res.status(400).json({ message: 'Partner Code dan Partner Name harus diisi' });
      }

      // Check if partner exists
      const existing = await BusinessPartner.findById(id);
      if (!existing) {
        return res.status(404).json({ message: 'Business Partner tidak ditemukan' });
      }

      // Check for duplicate code
      const codeExists = await BusinessPartner.codeExists(data.partner_code, id);
      if (codeExists) {
        return res.status(400).json({ message: 'Partner Code sudah digunakan oleh partner lain' });
      }

      await BusinessPartner.update(id, data, userId);
      res.json({ message: 'Business Partner berhasil diperbarui' });
    } catch (error) {
      console.error('Error in update BusinessPartner:', error);
      res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
  }
}

module.exports = BusinessPartnerController;
