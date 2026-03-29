const express = require('express');
const router = express.Router();
const {
  getProductions,
  getProduction,
  createProduction,
  updateProduction,
  deleteProduction,
} = require('../controllers/productionController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// CRUD routes
router
  .route('/')
  .get(getProductions)
  .post(createProduction);

router
  .route('/:id')
  .get(getProduction)
  .put(updateProduction)
  .delete(authorize('admin'), deleteProduction); // Only admin can delete

module.exports = router;

