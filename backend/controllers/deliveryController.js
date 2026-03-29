const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

// @desc    Get delivered meters for a design number
// @route   GET /api/deliveries/design/:designNo
// @access  Public (auth temporarily disabled)
exports.getDeliveredMtrs = async (req, res) => {
  try {
    const { designNo } = req.params;
    
    // sum totalMts and legacy mtrs/totalMtrs fields
    const deliveries = await Delivery.find({ designNo });
    const totalDelivered = deliveries.reduce((sum, delivery) => sum + (delivery.totalMts || delivery.totalMtrs || delivery.mtrs || 0), 0);
    
    res.status(200).json({
      success: true,
      data: {
        designNo,
        deliveredMtrs: totalDelivered,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all deliveries
// @route   GET /api/deliveries
// @access  Public (auth temporarily disabled)
exports.getDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate('orderId', 'designNo customerId')
      .populate({
        path: 'orderId',
        populate: {
          path: 'customerId',
          select: 'buyerName'
        }
      })
      .populate('customerId', 'buyerName')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single delivery
// @route   GET /api/deliveries/:id
// @access  Public (auth temporarily disabled)
exports.getDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('orderId')
      .populate({
        path: 'orderId',
        populate: {
          path: 'customerId',
          select: 'buyerName'
        }
      })
      .populate('customerId', 'buyerName');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    res.status(200).json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create delivery
// @route   POST /api/deliveries
// @access  Public (auth temporarily disabled)
exports.createDelivery = async (req, res) => {
  try {
    const { customerId, orderId, designNo, buyerName, date, quality, vehicleNo, rows } = req.body;

    // Validation - Required fields
    if (!customerId) {
      // Fallback for older frontend compatibility
      if (!orderId) {
        return res.status(400).json({ success: false, message: 'Customer or Order ID is required' });
      }
    }

    if (!designNo || !designNo.trim()) {
      return res.status(400).json({ success: false, message: 'Design number is required' });
    }

    if (!date || !date.trim()) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    if (!quality || !quality.trim()) {
      return res.status(400).json({ success: false, message: 'Quality is required' });
    }
    
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one delivery row is required' });
    }

    let totalMts = 0;
    const totalPcs = rows.length;

    for (const row of rows) {
      if (!row.loomNo || !row.loomNo.trim()) return res.status(400).json({ success: false, message: 'Row loom number is required' });
      if (!row.kg || isNaN(parseFloat(row.kg)) || parseFloat(row.kg) <= 0) return res.status(400).json({ success: false, message: 'Row kg must be a positive number' });
      if (!row.mts || isNaN(parseFloat(row.mts)) || parseFloat(row.mts) <= 0) return res.status(400).json({ success: false, message: 'Row meters must be a positive number' });
      totalMts += parseFloat(row.mts);
    }

    // Attempt to determine correct customerId if orderId is given but customerId missing
    let finalCustomerId = customerId;
    let finalBuyerName = buyerName;
    
    if (!finalCustomerId && orderId) {
      const order = await Order.findById(orderId).populate('customerId');
      if (order) {
        finalCustomerId = order.customerId ? order.customerId._id : null;
        if (!finalBuyerName && order.customerId) {
          finalBuyerName = order.customerId.buyerName;
        }
      }
    }

    if (!finalCustomerId) {
       return res.status(400).json({ success: false, message: 'Valid Customer ID is required' });
    }

    // Create delivery
    const delivery = await Delivery.create({
      customerId: finalCustomerId,
      orderId: orderId || undefined,
      designNo,
      buyerName: finalBuyerName || '',
      date,
      quality,
      vehicleNo: vehicleNo || '',
      rows,
      totalMts,
      totalPcs,
    });

    // Fetch the created delivery with populated data
    const createdDelivery = await Delivery.findById(delivery._id)
      .populate('orderId')
      .populate('customerId', 'buyerName');

    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      data: createdDelivery,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update delivery
// @route   PUT /api/deliveries/:id
// @access  Public (auth temporarily disabled)
exports.updateDelivery = async (req, res) => {
  try {
    const { customerId, orderId, designNo, buyerName, date, quality, vehicleNo, rows } = req.body;

    let delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    // Update fields
    delivery.customerId = customerId || delivery.customerId;
    if (orderId) delivery.orderId = orderId;
    delivery.designNo = designNo || delivery.designNo;
    delivery.buyerName = buyerName || delivery.buyerName;
    delivery.date = date || delivery.date;
    delivery.quality = quality || delivery.quality;
    delivery.vehicleNo = vehicleNo !== undefined ? vehicleNo : delivery.vehicleNo;
    
    if (rows && Array.isArray(rows) && rows.length > 0) {
      let totalMts = 0;
      for (const row of rows) {
        if (!row.loomNo || !row.loomNo.trim()) return res.status(400).json({ success: false, message: 'Row loom number is required' });
        if (!row.kg || isNaN(parseFloat(row.kg)) || parseFloat(row.kg) <= 0) return res.status(400).json({ success: false, message: 'Row kg must be a positive number' });
        if (!row.mts || isNaN(parseFloat(row.mts)) || parseFloat(row.mts) <= 0) return res.status(400).json({ success: false, message: 'Row meters must be a positive number' });
        totalMts += parseFloat(row.mts);
      }
      delivery.rows = rows;
      delivery.totalMts = totalMts;
      delivery.totalPcs = rows.length;
    }

    await delivery.save();

    const updatedDelivery = await Delivery.findById(delivery._id)
      .populate('orderId')
      .populate('customerId', 'buyerName');

    res.status(200).json({
      success: true,
      message: 'Delivery updated successfully',
      data: updatedDelivery,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete delivery
// @route   DELETE /api/deliveries/:id
// @access  Public (auth temporarily disabled)
exports.deleteDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    await delivery.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Delivery deleted successfully',
      data: {},
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};


