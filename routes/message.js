// routes/message.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Send message (POST)
router.post('/send', async (req, res) => {
  const { senderId, receiverId, message } = req.body;

  if (!senderId || !receiverId || !message) {
    return res.status(400).json({ message: 'Barcha maydonlar to‘ldirilishi kerak' });
  }

  const msg = new Message({ senderId, receiverId, message });
  await msg.save();

  res.status(201).json(msg);
});

// Get messages between two users (GET)
router.get('/:userId/:otherUserId', async (req, res) => {
  const { userId, otherUserId } = req.params;

  const messages = await Message.find({
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId }
    ]
  }).sort({ timestamp: 1 });

  res.json(messages);
});

module.exports = router;
