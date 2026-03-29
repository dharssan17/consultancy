const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  designNo: {
    type: String,
    required: [true, 'Design number is required'],
    unique: true,
    trim: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Customer is required'],
    ref: 'Customer',
  },
  fabricConstruction: {
    type: String,
    required: [true, 'Fabric construction is required'],
    trim: true,
  },
  warpCount: {
    type: String,
    trim: true,
    default: '',
  },
  weftCount: {
    type: String,
    trim: true,
    default: '',
  },
  totalEnds: {
    type: Number,
    default: null,
  },
  reed: {
    type: Number,
    default: null,
  },
  pick: {
    type: Number,
    default: null,
  },
  greige: {
    type: String,
    trim: true,
    default: '',
  },
  width: {
    type: String,
    trim: true,
    default: '',
  },
  loomNos: {
    type: [String],
    default: [],
  },
  beamNos: {
    type: [String],
    default: [],
  },
  warping: {
    type: String,
    trim: true,
    default: '',
  },
  sizing: {
    type: String,
    trim: true,
    default: '',
  },
  orderMtr: {
    type: Number,
    required: [true, 'Order meters is required'],
  },
  warpMtr: {
    type: Number,
    default: null,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  designSampleImage: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

// Index for faster queries
orderSchema.index({ customerId: 1 });

module.exports = mongoose.model('Order', orderSchema);

