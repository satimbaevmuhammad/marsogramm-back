const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  verificationCode: { type: String },
  codeExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema);