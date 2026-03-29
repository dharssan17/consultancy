const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Order is required'],
    ref: 'Order',
  },
  designNo: {
    type: String,
    required: [true, 'Design number is required'],
    trim: true,
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  ratePerMeter: {
    type: Number,
    required: [true, 'Rate per meter is required'],
    min: [0, 'Rate per meter cannot be negative'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  hsnCode: {
    type: String,
    trim: true,
  },
  deliveredMtrs: {
    type: Number,
    required: [true, 'Delivered meters is required'],
    min: [0, 'Delivered meters cannot be negative'],
  },
  subTotal: {
    type: Number,
    required: true,
    default: 0,
  },
  gstAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
    default: 0,
  },
  pdfPath: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'cancelled'],
    default: 'draft',
  },
}, {
  timestamps: true,
});

// Index for faster queries
invoiceSchema.index({ designNo: 1 });
invoiceSchema.index({ orderId: 1 });
invoiceSchema.index({ date: -1 });

// Pre-save hook to calculate totals
invoiceSchema.pre('save', function (next) {
  // Calculate subtotal
  this.subTotal = this.deliveredMtrs * this.ratePerMeter;
  
  // Calculate GST (18%)
  this.gstAmount = this.subTotal * 0.18;
  
  // Calculate grand total
  this.grandTotal = this.subTotal + this.gstAmount;
  
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);



