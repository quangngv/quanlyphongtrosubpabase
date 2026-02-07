const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  identityCard: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String },
  photo: { type: String }, // Base64 image string
  identityFrontImage: { type: String }, // CCCD front photo
  identityBackImage: { type: String }, // CCCD back photo
});

const utilitiesSchema = new mongoose.Schema({
  electricityUsed: { type: Number, default: 0 },
  electricityRate: { type: Number, required: true },
  waterUsed: { type: Number, default: 0 },
  waterRate: { type: Number, required: true },
  month: { type: String, required: true },
});

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true },
  month: { type: String, required: true },
  rent: { type: Number, required: true },
  electricity: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  paidDate: { type: String },
});

const roomSchema = new mongoose.Schema({
  roomNumber: { type: Number, unique: true }, // Auto-increment room number
  name: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['available', 'occupied'], 
    default: 'available' 
  },
  monthlyRent: { type: Number, required: true },
  dueDate: { type: String }, // ISO date for rent collection deadline
  tenant: tenantSchema,
  utilities: utilitiesSchema,
  payment: paymentSchema,
}, { 
  timestamps: true 
});

// Auto-increment roomNumber before save
roomSchema.pre('save', async function(next) {
  if (this.isNew && !this.roomNumber) {
    const lastRoom = await this.constructor.findOne({}, {}, { sort: { roomNumber: -1 } });
    this.roomNumber = lastRoom ? lastRoom.roomNumber + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('Room', roomSchema);
