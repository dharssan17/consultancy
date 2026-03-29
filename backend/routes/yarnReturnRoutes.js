const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getReturns,
  getReturn,
  createReturn,
  updateReturn,
  deleteReturn,
} = require('../controllers/yarnReturnController');

router.route('/')
  .get(protect, getReturns)
  .post(protect, authorize('admin'), createReturn);

router.route('/:id')
  .get(protect, getReturn)
  .put(protect, authorize('admin'), updateReturn)
  .delete(protect, authorize('admin'), deleteReturn);

module.exports = router;
