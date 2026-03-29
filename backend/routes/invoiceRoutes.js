const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// CRUD routes
router
  .route('/')
  .get(getInvoices)
  .post(authorize('admin'), createInvoice); // Only admin can create invoices

router
  .route('/:id')
  .get(getInvoice)
  .put(authorize('admin'), updateInvoice) // Only admin can update invoices
  .delete(authorize('admin'), deleteInvoice); // Only admin can delete invoices

module.exports = router;



