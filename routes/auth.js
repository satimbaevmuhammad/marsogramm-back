const express = require('express');
const router = express.Router();
const User = require('../models/User');
const sendCode = require('../sendCode');

// Send verification code to email
router.post('/send-code', async (req, res) => {
    const { username } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    let user = await User.findOne({ username });

    if (!user) {
        user = new User({ username });
    }

    user.verificationCode = code;
    user.codeExpires = expires;
    user.isVerified = false;

    await user.save();
    await sendCode(username, code);

    res.json({ message: 'Kod emailingizga yuborildi' });
});

// Verify the code
router.post('/verify-code', async (req, res) => {
    const { username, code } = req.body;
    const user = await User.findOne({ username });

    if (!user || user.verificationCode !== code) {
        return res.status(400).json({ message: 'Noto‘g‘ri kod' });
    }

    if (user.codeExpires < new Date()) {
        return res.status(400).json({ message: 'Kod eskirgan' });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.codeExpires = null;
    await user.save();

    res.json({ message: 'Tizimga kirdingiz', user: { id: user._id, username: user.username } });
});

module.exports = router;
