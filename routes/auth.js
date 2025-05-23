const express = require('express');
const router = express.Router();
const User = require('../models/User');
const sendCode = require('../sendCode');

// ✅ 1. Send verification code
router.post('/send-code', async (req, res) => {
  const { username } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  let user = await User.findOne({ username });
  if (!user) user = new User({ username });

  user.verificationCode = code;
  user.codeExpires = expires;
  user.isVerified = false;

  await user.save();
  await sendCode(username, code);

  res.json({ message: 'Verification code sent to your email' });
});

// ✅ 2. Verify code
router.post('/verify-code', async (req, res) => {
  const { username, code } = req.body;
  const user = await User.findOne({ username });

  if (!user || user.verificationCode !== code) {
    return res.status(400).json({ message: 'Invalid code' });
  }

  if (user.codeExpires < new Date()) {
    return res.status(400).json({ message: 'Code expired' });
  }

  user.isVerified = true;
  user.verificationCode = null;
  user.codeExpires = null;
  await user.save();

  res.json({
    message: 'Verification successful',
    user: { id: user._id, username: user.username }
  });
});

// ✅ 3. Complete profile
router.post('/complete-profile', async (req, res) => {
  const { username, name, avatar } = req.body;
  const user = await User.findOne({ username });

  if (!user || !user.isVerified) {
    return res.status(400).json({ message: 'Please verify first' });
  }

  user.name = name;
  if (avatar) {
    user.avatars = user.avatars || [];
    user.avatars.unshift(avatar);
    if (user.avatars.length > 100) {
      user.avatars = user.avatars.slice(0, 100);
    }
    user.avatar = avatar;
  }

  await user.save();

  res.json({
    message: 'Profile updated',
    user: {
      id: user._id,
      username: user.username,
      name: user.name,
      avatar: user.avatar
    }
  });
});

// ✅ 4. Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ isVerified: true }, '_id username name avatar');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
