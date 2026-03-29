const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSuppliers,
  getSuppliersDropdown,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/yarnSupplierController');

router.route('/')
  .get(protect, getSuppliers)
  .post(protect, authorize('admin'), createSupplier);

router.get('/dropdown', protect, getSuppliersDropdown);

router.route('/:id')
  .get(protect, getSupplier)
  .put(protect, authorize('admin'), updateSupplier)
  .delete(protect, authorize('admin'), deleteSupplier);

module.exports = router;
