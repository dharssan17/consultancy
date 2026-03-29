const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrdersDropdown,
  getOrder,
  getOrderDetails,
  createOrder,
  updateOrder,
  deleteOrder,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// CRUD routes
router
  .route('/')
  .get(getOrders)
  .post(createOrder);

// Dropdown endpoint (must be before /:id routes)
router.get('/dropdown', getOrdersDropdown);

// Details endpoint (must be before /:id routes)
router.get('/:id/details', getOrderDetails);

// Single order routes
router
  .route('/:id')
  .get(getOrder)
  .put(updateOrder)
  .delete(authorize('admin'), deleteOrder); // Only admin can delete

module.exports = router;

