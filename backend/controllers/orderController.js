const Order = require('../models/Order');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Public (auth temporarily disabled)
exports.getOrders = async (req, res) => {
  try {
    console.log('[ORDER API] GET /api/orders - Incoming request');
    console.log('[ORDER API] Query params:', req.query);
    
    const orders = await Order.find()
      .populate('customerId', 'buyerName')
      .sort({ date: -1, createdAt: -1 });
    
    console.log(`[ORDER API] Found ${orders.length} orders`);
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('[ORDER API] Error in getOrders:', error);
    console.error('[ORDER API] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders',
    });
  }
};

// @desc    Get orders for dropdown (designNo + orderId)
// @route   GET /api/orders/dropdown
// @access  Public (auth temporarily disabled)
exports.getOrdersDropdown = async (req, res) => {
  try {
    console.log('[ORDER API] GET /api/orders/dropdown - Incoming request');
    
    const orders = await Order.find()
      .select('designNo')
      .sort({ designNo: 1 });
    
    const dropdownData = orders.map(order => ({
      id: order._id,
      designNo: order.designNo,
    }));
    
    console.log(`[ORDER API] Dropdown: Found ${dropdownData.length} orders`);
    
    res.status(200).json({
      success: true,
      data: dropdownData,
    });
  } catch (error) {
    console.error('[ORDER API] Error in getOrdersDropdown:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders dropdown',
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Public (auth temporarily disabled)
exports.getOrder = async (req, res) => {
  try {
    console.log(`[ORDER API] GET /api/orders/${req.params.id} - Incoming request`);
    
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'buyerName');

    if (!order) {
      console.log(`[ORDER API] Order not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    console.log(`[ORDER API] Order found: ${order.designNo}`);
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('[ORDER API] Error in getOrder:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch order',
    });
  }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id/details
// @access  Public (auth temporarily disabled)
exports.getOrderDetails = async (req, res) => {
  try {
    console.log(`[ORDER API] GET /api/orders/${req.params.id}/details - Incoming request`);
    
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'buyerName');

    if (!order) {
      console.log(`[ORDER API] Order not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    console.log(`[ORDER API] Order details found: ${order.designNo}`);
    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        designNo: order.designNo,
        buyerName: order.customerId?.buyerName || '',
        orderMtr: order.orderMtr,
        fabricConstruction: order.fabricConstruction,
        loomNos: order.loomNos || [],
        warpCount: order.warpCount,
        weftCount: order.weftCount,
        totalEnds: order.totalEnds,
        reed: order.reed,
        pick: order.pick,
        greige: order.greige,
        width: order.width,
        beamNos: order.beamNos || [],
        warping: order.warping,
        sizing: order.sizing,
        warpMtr: order.warpMtr,
        description: order.description,
        designSampleImage: order.designSampleImage,
      },
    });
  } catch (error) {
    console.error('[ORDER API] Error in getOrderDetails:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch order details',
    });
  }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Public (auth temporarily disabled)
exports.createOrder = async (req, res) => {
  try {
    console.log('[ORDER API] POST /api/orders - Incoming request');
    console.log('[ORDER API] Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      date,
      designNo,
      customerId,
      fabricConstruction,
      warpCount,
      weftCount,
      totalEnds,
      reed,
      pick,
      greige,
      width,
      loomNos,
      beamNos,
      warping,
      sizing,
      orderMtr,
      warpMtr,
      description,
      designSampleImage,
    } = req.body;

    // Validation - Required fields
    if (!date || !date.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
      });
    }

    if (!designNo || !designNo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Design number is required',
      });
    }

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer is required',
      });
    }

    if (!fabricConstruction || !fabricConstruction.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Fabric construction is required',
      });
    }

    // Numeric validation - orderMtr must be positive
    if (!orderMtr || isNaN(parseFloat(orderMtr)) || parseFloat(orderMtr) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Order meters must be a positive number',
      });
    }

    // Optional numeric fields - if provided, must be positive
    if (totalEnds !== undefined && totalEnds !== null && (isNaN(parseFloat(totalEnds)) || parseFloat(totalEnds) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Total ends must be a positive number',
      });
    }

    if (reed !== undefined && reed !== null && (isNaN(parseFloat(reed)) || parseFloat(reed) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Reed must be a positive number',
      });
    }

    if (pick !== undefined && pick !== null && (isNaN(parseFloat(pick)) || parseFloat(pick) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Pick must be a positive number',
      });
    }

    if (warpMtr !== undefined && warpMtr !== null && (isNaN(parseFloat(warpMtr)) || parseFloat(warpMtr) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Warp meters must be a positive number',
      });
    }

    // Check if designNo already exists
    const existingOrder = await Order.findOne({ designNo });
    if (existingOrder) {
      console.log(`[ORDER API] Design number already exists: ${designNo}`);
      return res.status(400).json({
        success: false,
        message: 'Design number already exists',
      });
    }

    const order = await Order.create({
      date,
      designNo,
      customerId,
      fabricConstruction,
      warpCount: warpCount || '',
      weftCount: weftCount || '',
      totalEnds: totalEnds || null,
      reed: reed || null,
      pick: pick || null,
      greige: greige || '',
      width: width || '',
      loomNos: loomNos || [],
      beamNos: beamNos || [],
      warping: warping || '',
      sizing: sizing || '',
      orderMtr,
      warpMtr: warpMtr || null,
      description: description || '',
      designSampleImage: designSampleImage || '',
    });

    console.log(`[ORDER API] Order created successfully: ${order.designNo}`);

    const createdOrder = await Order.findById(order._id)
      .populate('customerId', 'buyerName');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: createdOrder,
    });
  } catch (error) {
    console.error('[ORDER API] Error in createOrder:', error);
    console.error('[ORDER API] Error stack:', error.stack);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Design number already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order',
    });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Public (auth temporarily disabled)
exports.updateOrder = async (req, res) => {
  try {
    console.log(`[ORDER API] PUT /api/orders/${req.params.id} - Incoming request`);
    console.log('[ORDER API] Request body:', JSON.stringify(req.body, null, 2));
    
    let order = await Order.findById(req.params.id);
    if (!order) {
      console.log(`[ORDER API] Order not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const {
      date,
      designNo,
      customerId,
      fabricConstruction,
      warpCount,
      weftCount,
      totalEnds,
      reed,
      pick,
      greige,
      width,
      loomNos,
      beamNos,
      warping,
      sizing,
      orderMtr,
      warpMtr,
      description,
      designSampleImage,
    } = req.body;

    // Validation - Required fields if provided
    if (date !== undefined && (!date || !date.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
      });
    }

    if (designNo !== undefined && (!designNo || !designNo.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Design number is required',
      });
    }

    if (fabricConstruction !== undefined && (!fabricConstruction || !fabricConstruction.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Fabric construction is required',
      });
    }

    // Numeric validation - orderMtr must be positive if provided
    if (orderMtr !== undefined && (isNaN(parseFloat(orderMtr)) || parseFloat(orderMtr) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Order meters must be a positive number',
      });
    }

    // Optional numeric fields - if provided, must be positive
    if (totalEnds !== undefined && totalEnds !== null && (isNaN(parseFloat(totalEnds)) || parseFloat(totalEnds) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Total ends must be a positive number',
      });
    }

    if (reed !== undefined && reed !== null && (isNaN(parseFloat(reed)) || parseFloat(reed) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Reed must be a positive number',
      });
    }

    if (pick !== undefined && pick !== null && (isNaN(parseFloat(pick)) || parseFloat(pick) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Pick must be a positive number',
      });
    }

    if (warpMtr !== undefined && warpMtr !== null && (isNaN(parseFloat(warpMtr)) || parseFloat(warpMtr) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Warp meters must be a positive number',
      });
    }

    // Check if designNo is being changed and if it already exists
    if (designNo && designNo.trim() !== order.designNo) {
      const existingOrder = await Order.findOne({ designNo: designNo.trim() });
      if (existingOrder) {
        console.log(`[ORDER API] Design number already exists: ${designNo}`);
        return res.status(400).json({
          success: false,
          message: 'Design number already exists',
        });
      }
    }

    // Update fields
    order.date = date || order.date;
    order.designNo = designNo || order.designNo;
    order.customerId = customerId || order.customerId;
    order.fabricConstruction = fabricConstruction || order.fabricConstruction;
    order.warpCount = warpCount !== undefined ? warpCount : order.warpCount;
    order.weftCount = weftCount !== undefined ? weftCount : order.weftCount;
    order.totalEnds = totalEnds !== undefined ? totalEnds : order.totalEnds;
    order.reed = reed !== undefined ? reed : order.reed;
    order.pick = pick !== undefined ? pick : order.pick;
    order.greige = greige !== undefined ? greige : order.greige;
    order.width = width !== undefined ? width : order.width;
    order.loomNos = loomNos !== undefined ? loomNos : order.loomNos;
    order.beamNos = beamNos !== undefined ? beamNos : order.beamNos;
    order.warping = warping !== undefined ? warping : order.warping;
    order.sizing = sizing !== undefined ? sizing : order.sizing;
    order.orderMtr = orderMtr !== undefined ? orderMtr : order.orderMtr;
    order.warpMtr = warpMtr !== undefined ? warpMtr : order.warpMtr;
    order.description = description !== undefined ? description : order.description;
    order.designSampleImage = designSampleImage !== undefined ? designSampleImage : order.designSampleImage;

    await order.save();

    console.log(`[ORDER API] Order updated successfully: ${order.designNo}`);

    const updatedOrder = await Order.findById(order._id)
      .populate('customerId', 'buyerName');

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('[ORDER API] Error in updateOrder:', error);
    console.error('[ORDER API] Error stack:', error.stack);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Design number already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order',
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Public (auth temporarily disabled)
exports.deleteOrder = async (req, res) => {
  try {
    console.log(`[ORDER API] DELETE /api/orders/${req.params.id} - Incoming request`);
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      console.log(`[ORDER API] Order not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    await order.deleteOne();
    console.log(`[ORDER API] Order deleted successfully: ${order.designNo}`);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('[ORDER API] Error in deleteOrder:', error);
    console.error('[ORDER API] Error stack:', error.stack);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete order',
    });
  }
};

