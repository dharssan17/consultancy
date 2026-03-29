const YarnSupplier = require('../models/YarnSupplier');

// @desc    Get all yarn suppliers
// @route   GET /api/yarn-suppliers
// @access  Private
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await YarnSupplier.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get yarn suppliers for dropdown
// @route   GET /api/yarn-suppliers/dropdown
// @access  Private
const getSuppliersDropdown = async (req, res) => {
  try {
    const suppliers = await YarnSupplier.find()
      .select('supplierName _id address gstNumber phone')
      .sort({ supplierName: 1 });
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single yarn supplier
// @route   GET /api/yarn-suppliers/:id
// @access  Private
const getSupplier = async (req, res) => {
  try {
    const supplier = await YarnSupplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new yarn supplier
// @route   POST /api/yarn-suppliers
// @access  Private
const createSupplier = async (req, res) => {
  try {
    const supplier = await YarnSupplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update yarn supplier
// @route   PUT /api/yarn-suppliers/:id
// @access  Private
const updateSupplier = async (req, res) => {
  try {
    let supplier = await YarnSupplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    supplier = await YarnSupplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete yarn supplier
// @route   DELETE /api/yarn-suppliers/:id
// @access  Private (Admin)
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await YarnSupplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    await YarnSupplier.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getSuppliers,
  getSuppliersDropdown,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
