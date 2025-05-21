const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Send message
router.post('/send', async (req, res) => {
  const { senderId, receiverId, message } = req.body;

  if (!senderId || !receiverId || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const msg = new Message({
    sender: senderId,
    receiver: receiverId,
    message
  });

  await msg.save();

  res.status(201).json(msg);
});

// Get messages between two users
router.get('/:userId/:otherUserId', async (req, res) => {
  const { userId, otherUserId } = req.params;

  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: otherUserId },
      { sender: otherUserId, receiver: userId }
    ]
  }).sort({ timestamp: 1 });

  res.json(messages);
});

module.exports = router;
