const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Customer is required'],
    ref: 'Customer',
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    // Kept for backward compatibility with older records
  },
  designNo: {
    type: String,
    required: [true, 'Design number is required'],
    trim: true,
  },
  buyerName: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  quality: {
    type: String,
    required: [true, 'Quality is required'],
    trim: true,
  },
  vehicleNo: {
    type: String,
    trim: true,
    default: '',
  },
  rows: [{
    loomNo: {
      type: String,
      required: [true, 'Loom number is required'],
      trim: true,
    },
    kg: {
      type: Number,
      required: [true, 'Kg is required'],
      min: [0, 'Kg cannot be negative'],
    },
    mts: {
      type: Number,
      required: [true, 'Mts is required'],
      min: [0, 'Mts cannot be negative'],
    },
    cm: {
      type: Number,
      default: null,
    }
  }],
  totalMts: {
    type: Number,
    required: [true, 'Total Mtrs is required'],
    default: 0,
  },
  totalPcs: {
    type: Number,
    required: [true, 'Total Pcs is required'],
    default: 0,
  },
  // Legacy fields kept for not breaking old data
  loomNo: { type: String },
  kg: { type: Number },
  mtrs: { type: Number },
  cm: { type: Number },
  totalMtrs: { type: Number }
}, {
  timestamps: true,
});

// Index for faster queries
deliverySchema.index({ designNo: 1 });
deliverySchema.index({ customerId: 1 });
deliverySchema.index({ date: -1 });

module.exports = mongoose.model('Delivery', deliverySchema);

