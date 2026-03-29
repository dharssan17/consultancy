const mongoose = require('mongoose');

const yarnReturnSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.0001, 'Quantity must be positive'],
  },
  vehicleNo: {
    type: String,
    trim: true,
  },
  time: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true,
});

yarnReturnSchema.index({ designNo: 1 });
yarnReturnSchema.index({ supplierId: 1 });

module.exports = mongoose.model('YarnReturn', yarnReturnSchema);
