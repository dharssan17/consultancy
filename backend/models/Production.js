const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  loomNo: {
    type: String,
    required: [true, 'Loom number is required'],
    trim: true,
  },
  dcNo: {
    type: String,
    trim: true,
    default: '',
  },
  pieces: {
    type: Number,
    default: null,
  },
  todayMtrs: {
    type: Number,
    required: [true, 'Today meters is required'],
    min: [0, 'Today meters cannot be negative'],
  },
  totalMtrs: {
    type: Number,
    default: 0,
  },
  remarks: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

// Index for faster queries
productionSchema.index({ designNo: 1 });
productionSchema.index({ orderId: 1 });
productionSchema.index({ date: -1 });

// Post-save hook to update totalMtrs for all productions with same designNo
productionSchema.post('save', async function () {
  const Production = mongoose.model('Production');
  const total = await Production.aggregate([
    { $match: { designNo: this.designNo } },
    { $group: { _id: null, total: { $sum: '$todayMtrs' } } }
  ]);
  
  const totalMtrs = total.length > 0 ? total[0].total : 0;
  
  // Update all productions with the same designNo
  await Production.updateMany(
    { designNo: this.designNo },
    { $set: { totalMtrs } }
  );
});

// Post-remove hook to update totalMtrs after deletion
productionSchema.post(['findOneAndDelete', 'findOneAndRemove'], async function (doc) {
  if (doc) {
    const Production = mongoose.model('Production');
    const total = await Production.aggregate([
      { $match: { designNo: doc.designNo } },
      { $group: { _id: null, total: { $sum: '$todayMtrs' } } }
    ]);
    
    const totalMtrs = total.length > 0 ? total[0].total : 0;
    
    await Production.updateMany(
      { designNo: doc.designNo },
      { $set: { totalMtrs } }
    );
  }
});

module.exports = mongoose.model('Production', productionSchema);

