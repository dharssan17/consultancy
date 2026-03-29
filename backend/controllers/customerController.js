const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private (admin, data_entry)
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ buyerName: 1 });
    
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get customers for dropdown (id + buyerName only)
// @route   GET /api/customers/dropdown
// @access  Private (admin, data_entry)
exports.getCustomersDropdown = async (req, res) => {
  try {
    const customers = await Customer.find()
      .select('buyerName')
      .sort({ buyerName: 1 });
    
    const dropdownData = customers.map(customer => ({
      id: customer._id,
      buyerName: customer.buyerName,
    }));
    
    res.status(200).json({
      success: true,
      data: dropdownData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private (admin, data_entry)
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private (admin, data_entry)
exports.createCustomer = async (req, res) => {
  try {
    const { buyerName, address, gstNo, phone, email, city } = req.body;

    // Validation - Required fields
    if (!buyerName || !buyerName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Buyer name is required',
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone is required',
      });
    }

    // Phone validation - exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be exactly 10 digits',
      });
    }

    // Email validation - optional but must be valid format if provided
    if (email && email.trim()) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }
    }

    // Check if buyerName already exists
    const existingCustomer = await Customer.findOne({ buyerName: buyerName.trim() });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Buyer name already exists',
      });
    }

    const customer = await Customer.create({
      buyerName,
      address,
      gstNo: gstNo || '',
      phone,
      email: email || '',
      city: city || '',
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Buyer name already exists',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (admin, data_entry)
exports.updateCustomer = async (req, res) => {
  try {
    const { buyerName, address, gstNo, phone, email, city } = req.body;

    // Check if customer exists
    let customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Validation - Required fields
    if (buyerName !== undefined && !buyerName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Buyer name is required',
      });
    }

    if (phone !== undefined && (!phone || !phone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Phone is required',
      });
    }

    // Phone validation - exactly 10 digits
    if (phone && phone.trim()) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be exactly 10 digits',
        });
      }
    }

    // Email validation - optional but must be valid format if provided
    if (email && email.trim()) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }
    }

    // Check if buyerName is being changed and if it already exists
    if (buyerName && buyerName.trim() !== customer.buyerName) {
      const existingCustomer = await Customer.findOne({ buyerName: buyerName.trim() });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Buyer name already exists',
        });
      }
    }

    // Update fields
    customer.buyerName = buyerName || customer.buyerName;
    customer.address = address || customer.address;
    customer.gstNo = gstNo !== undefined ? gstNo : customer.gstNo;
    customer.phone = phone || customer.phone;
    customer.email = email !== undefined ? email : customer.email;
    customer.city = city !== undefined ? city : customer.city;

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Buyer name already exists',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (admin only)
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    await customer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
      data: {},
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

