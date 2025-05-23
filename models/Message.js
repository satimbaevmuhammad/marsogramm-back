const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  receiver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  // Add these fields for better message handling
  isRead: { 
    type: Boolean, 
    default: false 
  },
  readAt: { 
    type: Date 
  },
  messageType: { 
    type: String, 
    default: 'text',
    enum: ['text', 'image', 'file', 'audio']
  }
});

// Index for faster queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);