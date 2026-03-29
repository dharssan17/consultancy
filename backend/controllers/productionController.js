const Production = require('../models/Production');
const Order = require('../models/Order');

// @desc    Get all productions
// @route   GET /api/productions
// @access  Private (admin, data_entry)
exports.getProductions = async (req, res) => {
  try {
    const { designNo, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (designNo) {
      query.designNo = { $regex: designNo, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const productions = await Production.find(query)
      .populate('orderId', 'designNo customerId fabricConstruction loomNos orderMtr')
      .populate({
        path: 'orderId',
        populate: {
          path: 'customerId',
          select: 'buyerName'
        }
      })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Production.countDocuments(query);

    res.status(200).json({
      success: true,
      count: productions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: productions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single production
// @route   GET /api/productions/:id
// @access  Private (admin, data_entry)
exports.getProduction = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id)
      .populate('orderId')
      .populate({
        path: 'orderId',
        populate: {
          path: 'customerId',
          select: 'buyerName'
        }
      });

    if (!production) {
      return res.status(404).json({
        success: false,
        message: 'Production not found',
      });
    }

    res.status(200).json({
      success: true,
      data: production,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Production not found',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create production
// @route   POST /api/productions
// @access  Private (admin, data_entry)
exports.createProduction = async (req, res) => {
  try {
    const { orderId, designNo, date, loomNo, dcNo, pieces, todayMtrs, remarks } = req.body;

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

    if (!date || !date.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
      });
    }

    if (!loomNo || !loomNo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Loom number is required',
      });
    }

    // Numeric validation - todayMtrs must be positive
    if (!todayMtrs || isNaN(parseFloat(todayMtrs)) || parseFloat(todayMtrs) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Today meters must be a positive number',
      });
    }

    // Optional numeric field - if provided, must be positive
    if (pieces !== undefined && pieces !== null && (isNaN(parseFloat(pieces)) || parseFloat(pieces) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Pieces must be a positive number',
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

    // Create production
    const production = await Production.create({
      orderId,
      designNo,
      date,
      loomNo,
      dcNo: dcNo || '',
      pieces: pieces || null,
      todayMtrs,
      remarks: remarks || '',
    });

    // Recalculate totalMtrs for this designNo
    const total = await Production.aggregate([
      { $match: { designNo } },
      { $group: { _id: null, total: { $sum: '$todayMtrs' } } }
    ]);
    
    const totalMtrs = total.length > 0 ? total[0].total : todayMtrs;
    
    // Update all productions with the same designNo
    await Production.updateMany(
      { designNo },
      { $set: { totalMtrs } }
    );

    // Fetch the created production with populated data
    const createdProduction = await Production.findById(production._id)
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
      message: 'Production created successfully',
      data: createdProduction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update production
// @route   PUT /api/productions/:id
// @access  Private (admin, data_entry)
exports.updateProduction = async (req, res) => {
  try {
    const { orderId, designNo, date, loomNo, dcNo, pieces, todayMtrs, remarks } = req.body;

    let production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({
        success: false,
        message: 'Production not found',
      });
    }

    // Store old designNo for recalculation
    const oldDesignNo = production.designNo;
    const newDesignNo = designNo || oldDesignNo;

    // Update fields
    production.orderId = orderId || production.orderId;
    production.designNo = newDesignNo;
    production.date = date || production.date;
    production.loomNo = loomNo || production.loomNo;
    production.dcNo = dcNo !== undefined ? dcNo : production.dcNo;
    production.pieces = pieces !== undefined ? pieces : production.pieces;
    production.todayMtrs = todayMtrs !== undefined ? todayMtrs : production.todayMtrs;
    production.remarks = remarks !== undefined ? remarks : production.remarks;

    await production.save();

    // Recalculate totalMtrs for both old and new designNo if changed
    if (oldDesignNo !== newDesignNo || todayMtrs !== undefined) {
      // Update old designNo totals
      const oldTotal = await Production.aggregate([
        { $match: { designNo: oldDesignNo } },
        { $group: { _id: null, total: { $sum: '$todayMtrs' } } }
      ]);
      const oldTotalMtrs = oldTotal.length > 0 ? oldTotal[0].total : 0;
      await Production.updateMany(
        { designNo: oldDesignNo },
        { $set: { totalMtrs: oldTotalMtrs } }
      );

      // Update new designNo totals
      const newTotal = await Production.aggregate([
        { $match: { designNo: newDesignNo } },
        { $group: { _id: null, total: { $sum: '$todayMtrs' } } }
      ]);
      const newTotalMtrs = newTotal.length > 0 ? newTotal[0].total : 0;
      await Production.updateMany(
        { designNo: newDesignNo },
        { $set: { totalMtrs: newTotalMtrs } }
      );
    }

    // Fetch updated production with populated data
    const updatedProduction = await Production.findById(production._id)
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
      message: 'Production updated successfully',
      data: updatedProduction,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Production not found',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete production
// @route   DELETE /api/productions/:id
// @access  Private (admin only)
exports.deleteProduction = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);

    if (!production) {
      return res.status(404).json({
        success: false,
        message: 'Production not found',
      });
    }

    const designNo = production.designNo;

    await production.deleteOne();

    // Recalculate totalMtrs for this designNo
    const total = await Production.aggregate([
      { $match: { designNo } },
      { $group: { _id: null, total: { $sum: '$todayMtrs' } } }
    ]);
    
    const totalMtrs = total.length > 0 ? total[0].total : 0;
    
    await Production.updateMany(
      { designNo },
      { $set: { totalMtrs } }
    );

    res.status(200).json({
      success: true,
      message: 'Production deleted successfully',
      data: {},
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Production not found',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

