const mongoose = require('mongoose');
const QRCode = require('qrcode');

// Sub-schema for receipt records
const receiptSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'credit_card', 'bank_transfer', 'online', 'razorpay'],
    required: true 
  },
  transactionId: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const attendanceSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['present', 'absent', 'excused'],
    default: 'present'
  }
});


const memberSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  zone: { 
    type: String, 
    enum: ['North', 'South', 'East', 'West', 'Central'], 
    required: true 
  },
  membershipType: { 
    type: String, 
    enum: ['Regular', 'Premium', 'VIP', 'Student'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive', 'Pending', 'Suspended'], 
    default: 'Pending' 
  },
  renewalHistory: [
  {
    date: { type: Date, default: Date.now },
    renewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    notes: String
  }
],

  joinDate: { type: Date, default: Date.now },
  expiryDate: Date,
  qrCode: String,
  payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventPayment' }],
  profileImage: String,
  receipts: [String], // For uploaded file paths (PDF/image)
  receiptRecords: [receiptSchema], // For structured receipt metadata,
 attendances: [attendanceSchema]
});

// Generate QR code before saving
memberSchema.pre('save', async function(next) {
  if (!this.qrCode) {
    try {
      this.qrCode = await QRCode.toDataURL(this._id.toString());
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Member', memberSchema);
