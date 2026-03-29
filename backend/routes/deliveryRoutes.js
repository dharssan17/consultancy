const express = require('express');
const router = express.Router();
const {
  getDeliveries,
  getDeliveredMtrs,
  getDelivery,
  createDelivery,
  updateDelivery,
  deleteDelivery,
} = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get delivered meters for design number
router.get('/design/:designNo', getDeliveredMtrs);

// CRUD routes
router
  .route('/')
  .get(getDeliveries)
  .post(createDelivery);

router
  .route('/:id')
  .get(getDelivery)
  .put(updateDelivery)
  .delete(authorize('admin'), deleteDelivery); // Only admin can delete

module.exports = router;

