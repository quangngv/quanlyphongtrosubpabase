const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  roomName: { type: String, required: true },
  tenantName: { type: String },
  month: { type: String, required: true },
  rent: { type: Number, required: true },
  electricity: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  paidDate: { type: String },
  electricityUsed: { type: Number },
  waterUsed: { type: Number },
  electricityRate: { type: Number },
  waterRate: { type: Number },
}, { 
  timestamps: true 
});

module.exports = mongoose.model('PaymentHistory', paymentHistorySchema);
