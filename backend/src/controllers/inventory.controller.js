const inventoryService = require('../services/inventory.service');

const createSupplier = async (req, res, next) => {
  try {
    const supplier = await inventoryService.createSupplier(req.body);
    res.status(201).json({ success: true, supplier });
  } catch (e) {
    next(e);
  }
};

const getSuppliers = async (req, res, next) => {
  try {
    const result = await inventoryService.getSuppliers(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await inventoryService.updateSupplier(req.params.id, req.body);
    res.status(200).json({ success: true, supplier });
  } catch (e) {
    next(e);
  }
};

const createStockImport = async (req, res, next) => {
  try {
    const stockImport = await inventoryService.createStockImport(req.user.id, req.body);
    res.status(201).json({ success: true, stockImport });
  } catch (e) {
    next(e);
  }
};

const getStockImports = async (req, res, next) => {
  try {
    const result = await inventoryService.getStockImports(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

const getStockImportById = async (req, res, next) => {
  try {
    const stockImport = await inventoryService.getStockImportById(req.params.id);
    res.status(200).json({ success: true, stockImport });
  } catch (e) {
    next(e);
  }
};

const getSerials = async (req, res, next) => {
  try {
    const result = await inventoryService.getSerialUnits(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

const lookupSerial = async (req, res, next) => {
  try {
    const unit = await inventoryService.lookupSerial(req.query.q);
    res.status(200).json({ success: true, serial: unit });
  } catch (e) {
    next(e);
  }
};

const getLowStock = async (req, res, next) => {
  try {
    const result = await inventoryService.getLowStockReport();
    res.status(200).json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

const getSerialsByProduct = async (req, res, next) => {
  try {
    const result = await inventoryService.getSerialsByProductId(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  createSupplier,
  getSuppliers,
  updateSupplier,
  createStockImport,
  getStockImports,
  getStockImportById,
  getSerials,
  lookupSerial,
  getLowStock,
  getSerialsByProduct,
};
