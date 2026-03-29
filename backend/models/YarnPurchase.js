const mongoose = require('mongoose');

const yarnPurchaseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'YarnSupplier',
    required: [true, 'Supplier is required'],
  },
  designNo: {
    type: String,
    required: [true, 'Design number is required'],
    trim: true,
  },
  yarnType: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.0001, 'Quantity must be positive'],
  },
  rate: {
    type: Number,
    default: 0,
    min: [0, 'Rate cannot be negative'],
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true,
});

yarnPurchaseSchema.index({ designNo: 1 });
yarnPurchaseSchema.index({ supplierId: 1 });

// Pre-save hook to calculate totalAmount implicitly
yarnPurchaseSchema.pre('save', function (next) {
  this.totalAmount = this.quantity * (this.rate || 0);
  next();
});

module.exports = mongoose.model('YarnPurchase', yarnPurchaseSchema);
