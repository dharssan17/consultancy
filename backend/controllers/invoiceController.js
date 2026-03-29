const Invoice = require('../models/Invoice');
const Order = require('../models/Order');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Public (auth temporarily disabled)
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('orderId', 'designNo customerId')
      .populate({
        path: 'orderId',
        populate: {
          path: 'customerId',
          select: 'buyerName'
        }
      })
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Public (auth temporarily disabled)
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('orderId')
      .populate({
        path: 'orderId',
        populate: {
          path: 'customerId',
          select: 'buyerName'
        }
      });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Public (auth temporarily disabled)
exports.createInvoice = async (req, res) => {
  try {
    const { orderId, designNo, customerName, date, ratePerMeter, deliveredMtrs, pdfPath, status } = req.body;

    // Validation - Required fields
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    if (!designNo || !designNo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Design number is required',
      });
    }

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required',
      });
    }

    if (!date || !date.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
      });
    }

    // Numeric validations - must be positive
    if (!ratePerMeter || isNaN(parseFloat(ratePerMeter)) || parseFloat(ratePerMeter) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Rate per meter must be a positive number',
      });
    }

    if (!deliveredMtrs || isNaN(parseFloat(deliveredMtrs)) || parseFloat(deliveredMtrs) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Delivered meters must be a positive number',
      });
    }

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Create invoice (totals will be auto-calculated by pre-save hook)
    const invoice = await Invoice.create({
      orderId,
      designNo,
      customerName,
      date,
      ratePerMeter: parseFloat(ratePerMeter),
      deliveredMtrs: parseFloat(deliveredMtrs),
      pdfPath: pdfPath || '',
      status: status || 'draft',
    });

    // Fetch the created invoice with populated data
    const createdInvoice = await Invoice.findById(invoice._id)
      .populate('orderId')
      .populate({
        path: 'orderId',
        populate: {
          path: 'customerId',
          select: 'buyerName'
        }
      });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: createdInvoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Public (auth temporarily disabled)
exports.updateInvoice = async (req, res) => {
  try {
    const { orderId, designNo, customerName, date, ratePerMeter, deliveredMtrs, pdfPath, status } = req.body;

    let invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Update fields (totals will be auto-calculated by pre-save hook)
    invoice.orderId = orderId || invoice.orderId;
    invoice.designNo = designNo || invoice.designNo;
    invoice.customerName = customerName || invoice.customerName;
    invoice.date = date || invoice.date;
    invoice.ratePerMeter = ratePerMeter !== undefined ? parseFloat(ratePerMeter) : invoice.ratePerMeter;
    invoice.deliveredMtrs = deliveredMtrs !== undefined ? parseFloat(deliveredMtrs) : invoice.deliveredMtrs;
    invoice.pdfPath = pdfPath !== undefined ? pdfPath : invoice.pdfPath;
    invoice.status = status !== undefined ? status : invoice.status;

    await invoice.save();

    // Fetch updated invoice with populated data
    const updatedInvoice = await Invoice.findById(invoice._id)
      .populate('orderId')
      .populate({
        path: 'orderId',
        populate: {
          path: 'customerId',
          select: 'buyerName'
        }
      });

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Public (auth temporarily disabled)
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    await invoice.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully',
      data: {},
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};



