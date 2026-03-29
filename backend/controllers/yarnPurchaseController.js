const YarnPurchase = require('../models/YarnPurchase');

// @desc    Get all yarn purchases
// @route   GET /api/yarn-purchases
// @access  Private
const getPurchases = async (req, res) => {
  try {
    const purchases = await YarnPurchase.find()
      .populate('supplierId', 'supplierName')
      .sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single yarn purchase
// @route   GET /api/yarn-purchases/:id
// @access  Private
const getPurchase = async (req, res) => {
  try {
    const purchase = await YarnPurchase.findById(req.params.id).populate('supplierId', 'supplierName address');
    if (!purchase) {
      return res.status(404).json({ success: false, error: 'Purchase not found' });
    }
    res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new yarn purchase
// @route   POST /api/yarn-purchases
// @access  Private
const createPurchase = async (req, res) => {
  try {
    const purchase = await YarnPurchase.create(req.body);
    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update yarn purchase
// @route   PUT /api/yarn-purchases/:id
// @access  Private
const updatePurchase = async (req, res) => {
  try {
    let purchase = await YarnPurchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ success: false, error: 'Purchase not found' });
    }
    purchase = await YarnPurchase.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete yarn purchase
// @route   DELETE /api/yarn-purchases/:id
// @access  Private (Admin)
const deletePurchase = async (req, res) => {
  try {
    const purchase = await YarnPurchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ success: false, error: 'Purchase not found' });
    }
    await YarnPurchase.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
};
