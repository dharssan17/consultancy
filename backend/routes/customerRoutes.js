const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomersDropdown,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Dropdown endpoint (for Order module)
router.get('/dropdown', getCustomersDropdown);

// CRUD routes
router
  .route('/')
  .get(getCustomers)
  .post(createCustomer);

router
  .route('/:id')
  .get(getCustomer)
  .put(updateCustomer)
  .delete(authorize('admin'), deleteCustomer); // Only admin can delete

module.exports = router;

