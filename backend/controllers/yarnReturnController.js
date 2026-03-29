const YarnReturn = require('../models/YarnReturn');

// @desc    Get all yarn returns
// @route   GET /api/yarn-returns
// @access  Private
const getReturns = async (req, res) => {
  try {
    const returns = await YarnReturn.find()
      .populate('supplierId', 'supplierName')
      .sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, data: returns });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single yarn return
// @route   GET /api/yarn-returns/:id
// @access  Private
const getReturn = async (req, res) => {
  try {
    const yarnReturn = await YarnReturn.findById(req.params.id).populate('supplierId', 'supplierName address');
    if (!yarnReturn) {
      return res.status(404).json({ success: false, error: 'Return not found' });
    }
    res.status(200).json({ success: true, data: yarnReturn });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new yarn return
// @route   POST /api/yarn-returns
// @access  Private
const createReturn = async (req, res) => {
  try {
    const yarnReturn = await YarnReturn.create(req.body);
    res.status(201).json({ success: true, data: yarnReturn });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update yarn return
// @route   PUT /api/yarn-returns/:id
// @access  Private
const updateReturn = async (req, res) => {
  try {
    let yarnReturn = await YarnReturn.findById(req.params.id);
    if (!yarnReturn) {
      return res.status(404).json({ success: false, error: 'Return not found' });
    }
    yarnReturn = await YarnReturn.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: yarnReturn });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete yarn return
// @route   DELETE /api/yarn-returns/:id
// @access  Private (Admin)
const deleteReturn = async (req, res) => {
  try {
    const yarnReturn = await YarnReturn.findById(req.params.id);
    if (!yarnReturn) {
      return res.status(404).json({ success: false, error: 'Return not found' });
    }
    await YarnReturn.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getReturns,
  getReturn,
  createReturn,
  updateReturn,
  deleteReturn,
};
