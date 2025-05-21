const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String },
  avatar: { type: String },
  avatars: [{ type: String }],
  verificationCode: { type: String },
  codeExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema);
