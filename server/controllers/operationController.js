const OperationModel = require('../models/operationModel');

exports.getAllOperations = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      job_order_type: req.query.job_order_type,
      search: req.query.search
    };
    
    const operations = await OperationModel.findAll(filters);
    res.json({ status: 'success', data: operations });
  } catch (error) {
    console.error('Error in getAllOperations:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data operations' });
  }
};

exports.getOperationById = async (req, res) => {
  try {
    const operation = await OperationModel.findById(req.params.id);
    if (!operation) {
      return res.status(404).json({ status: 'error', message: 'Operation tidak ditemukan' });
    }
    res.json({ status: 'success', data: operation });
  } catch (error) {
    console.error('Error in getOperationById:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data operation' });
  }
};

exports.createOperation = async (req, res) => {
  try {
    const data = {
      ...req.body,
      created_by: req.user.id
    };
    
    const operationId = await OperationModel.create(data);
    res.status(201).json({ status: 'success', message: 'Operation berhasil dibuat', data: { id: operationId } });
  } catch (error) {
    console.error('Error in createOperation:', error);
    res.status(500).json({ status: 'error', message: 'Gagal membuat operation' });
  }
};

exports.updateOperation = async (req, res) => {
  try {
    await OperationModel.update(req.params.id, req.body, req.user.id);
    res.json({ status: 'success', message: 'Operation berhasil diupdate' });
  } catch (error) {
    console.error('Error in updateOperation:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengupdate operation' });
  }
};

exports.updateOperationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    await OperationModel.updateStatus(req.params.id, status, req.user.id, notes);
    res.json({ status: 'success', message: 'Status operation berhasil diupdate' });
  } catch (error) {
    console.error('Error in updateOperationStatus:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengupdate status' });
  }
};

exports.getOperationEvents = async (req, res) => {
  try {
    const events = await OperationModel.getEvents(req.params.id);
    res.json({ status: 'success', data: events });
  } catch (error) {
    console.error('Error in getOperationEvents:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil log events' });
  }
};

exports.getOperationsByJobOrder = async (req, res) => {
  try {
    const operations = await OperationModel.findByJobOrderId(req.params.id);
    res.json({ status: 'success', data: operations });
  } catch (error) {
    console.error('Error in getOperationsByJobOrder:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data operations' });
  }
};

exports.getAllocationBalance = async (req, res) => {
  try {
    const balance = await OperationModel.getOperationBalance(req.params.id);
    if (!balance) {
      return res.status(404).json({ status: 'error', message: 'Job Order tidak ditemukan' });
    }
    res.json({ status: 'success', data: balance });
  } catch (error) {
    console.error('Error in getAllocationBalance:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data balance allocation' });
  }
};
