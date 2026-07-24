const WarehouseModel = require('../../models/masterData/warehouseModel');

exports.getAllWarehouses = async (req, res, next) => {
  try {
    const { search, status, country_id, warehouse_type, city } = req.query;
    const warehouses = await WarehouseModel.findAll({ search, status, country_id, warehouse_type, city });
    res.json(warehouses);
  } catch (error) {
    next(error);
  }
};

exports.getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await WarehouseModel.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
    res.json(warehouse);
  } catch (error) {
    next(error);
  }
};

exports.createWarehouse = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { warehouse_code, warehouse_name, warehouse_type, country_id } = req.body;
    
    if (!warehouse_code || !warehouse_name || !warehouse_type || !country_id) {
      return res.status(400).json({ message: 'Warehouse Code, Name, Type, and Country are required' });
    }

    const insertId = await WarehouseModel.create(req.body, userId);
    res.status(201).json({ message: 'Warehouse created successfully', id: insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Warehouse Code already exists' });
    }
    next(error);
  }
};

exports.updateWarehouse = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const warehouse = await WarehouseModel.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });

    const { warehouse_code, warehouse_name, warehouse_type, country_id } = req.body;
    if (!warehouse_code || !warehouse_name || !warehouse_type || !country_id) {
      return res.status(400).json({ message: 'Warehouse Code, Name, Type, and Country are required' });
    }

    await WarehouseModel.update(req.params.id, req.body, userId);
    res.json({ message: 'Warehouse updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Warehouse Code already exists' });
    }
    next(error);
  }
};
