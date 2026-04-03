const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const inventoryController = require('../controllers/inventory.controller');
const {
  createSupplierSchema,
  updateSupplierSchema,
  createStockImportSchema,
  listStockImportsQuerySchema,
  listSerialsQuerySchema,
  lookupSerialQuerySchema,
  supplierParamsSchema,
  stockImportParamsSchema,
  productParamsForSerialsSchema,
  listSuppliersQuerySchema,
} = require('../validations/inventory.validation');

router.use(protect, restrictTo('ADMIN'));

router.get('/suppliers', validate(listSuppliersQuerySchema, 'query'), inventoryController.getSuppliers);
router.post('/suppliers', validate(createSupplierSchema), inventoryController.createSupplier);
router.patch(
  '/suppliers/:id',
  validate(supplierParamsSchema, 'params'),
  validate(updateSupplierSchema),
  inventoryController.updateSupplier
);

router.get(
  '/stock-imports',
  validate(listStockImportsQuerySchema, 'query'),
  inventoryController.getStockImports
);
router.post('/stock-imports', validate(createStockImportSchema), inventoryController.createStockImport);
router.get(
  '/stock-imports/:id',
  validate(stockImportParamsSchema, 'params'),
  inventoryController.getStockImportById
);

router.get('/serials', validate(listSerialsQuerySchema, 'query'), inventoryController.getSerials);
router.get('/serials/lookup', validate(lookupSerialQuerySchema, 'query'), inventoryController.lookupSerial);
router.get('/serials/low-stock', inventoryController.getLowStock);

router.get(
  '/products/:id/serials',
  validate(productParamsForSerialsSchema, 'params'),
  inventoryController.getSerialsByProduct
);

module.exports = router;
