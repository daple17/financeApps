const PortModel = require('../../models/masterData/portModel');

exports.getAllPorts = async (req, res, next) => {
  try {
    const { search, status, country_id, port_type, trade_scope } = req.query;
    const ports = await PortModel.findAll({ search, status, country_id, port_type, trade_scope });
    res.json(ports);
  } catch (error) {
    next(error);
  }
};

exports.getPortById = async (req, res, next) => {
  try {
    const port = await PortModel.findById(req.params.id);
    if (!port) return res.status(404).json({ message: 'Port not found' });
    res.json(port);
  } catch (error) {
    next(error);
  }
};

exports.createPort = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { port_code, port_name, port_type, country_id } = req.body;
    
    if (!port_code || !port_name || !port_type || !country_id) {
      return res.status(400).json({ message: 'Port Code, Name, Type, and Country are required' });
    }

    const insertId = await PortModel.create(req.body, userId);
    res.status(201).json({ message: 'Port created successfully', id: insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Port Code already exists' });
    }
    next(error);
  }
};

exports.updatePort = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const port = await PortModel.findById(req.params.id);
    if (!port) return res.status(404).json({ message: 'Port not found' });

    const { port_code, port_name, port_type, country_id } = req.body;
    if (!port_code || !port_name || !port_type || !country_id) {
      return res.status(400).json({ message: 'Port Code, Name, Type, and Country are required' });
    }

    await PortModel.update(req.params.id, req.body, userId);
    res.json({ message: 'Port updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Port Code already exists' });
    }
    next(error);
  }
};
