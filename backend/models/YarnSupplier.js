const mongoose = require('mongoose');

const yarnSupplierSchema = new mongoose.Schema({
  supplierName: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\d{10}$/.test(v); // 10 digit validation
      },
      message: props => `${props.value} is not a valid 10-digit phone number!`
    }
  },
  gstNumber: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('YarnSupplier', yarnSupplierSchema);
