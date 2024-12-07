const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model('Verification', verificationSchema);