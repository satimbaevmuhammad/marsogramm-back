const express = require('express');
const router = express.Router();
const User = require('../models/User');
const sendCode = require('../sendCode');

// Send code to email
router.post('/send-code', async (req, res) => {
    const { username } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    let user = await User.findOne({ username });
    if (!user) user = new User({ username });

    user.verificationCode = code;
    user.codeExpires = expires;
    user.isVerified = false;

    await user.save();
    await sendCode(username, code);

    res.json({ message: 'Kod emailingizga yuborildi' });
});

// Verify code
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

// Complete profile with name and avatar
router.post('/complete-profile', async (req, res) => {
    const { username, name, avatar } = req.body;
    const user = await User.findOne({ username });

    if (!user || !user.isVerified) {
        return res.status(400).json({ message: 'Avval tasdiqlang' });
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
        message: 'Profil to‘ldirildi',
        user: {
            id: user._id,
            username: user.username,
            name: user.name,
            avatar: user.avatar
        }
    });
});

module.exports = router;
