const mongoose = require('mongoose');

const clientUserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  accessCode: { type: String, required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  isActive: { type: Boolean, default: true },
}, { 
  timestamps: true 
});

module.exports = mongoose.model('ClientUser', clientUserSchema);
