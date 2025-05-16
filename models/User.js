const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String },
  avatar: { type: String }, // current profile picture
  avatars: [{ type: String }], // all previous avatars
  verificationCode: { type: String },
  codeExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
});


module.exports = mongoose.model('User', userSchema);