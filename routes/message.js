const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Send message (HTTP endpoint - backup for socket)
router.post('/send', async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;

    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      message: message.trim(),
      createdAt: new Date()
    });

    await newMessage.save();

    res.status(201).json({
      _id: newMessage._id,
      senderId: newMessage.sender,
      receiverId: newMessage.receiver,
      message: newMessage.message,
      createdAt: newMessage.createdAt
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Get messages between two users
router.get('/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!userId || !otherUserId) {
      return res.status(400).json({ message: 'User IDs are required' });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    })
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Use lean() for better performance

    // Transform the response to match frontend expectations
    const transformedMessages = messages.map(msg => ({
      _id: msg._id,
      senderId: msg.sender,
      receiverId: msg.receiver,
      message: msg.message,
      createdAt: msg.createdAt,
      isRead: msg.isRead
    }));

    res.json(transformedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Mark messages as read
router.put('/mark-read', async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;

    if (!userId || !otherUserId) {
      return res.status(400).json({ message: 'User IDs are required' });
    }

    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const unreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
});

// Get recent conversations
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: mongoose.Types.ObjectId(userId) },
            { receiver: mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", mongoose.Types.ObjectId(userId)] },
              "$receiver",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", mongoose.Types.ObjectId(userId)] },
                    { $eq: ["$isRead", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Failed to get conversations' });
  }
});

module.exports = router;