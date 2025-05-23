const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/upload'));
app.use('/api/messages', require('./routes/message'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Store online users and their socket IDs
const onlineUsers = new Map();
const userRooms = new Map();

// Socket.io logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user going online
  socket.on('userOnline', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} is now online`);

    // Broadcast updated online users list
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });

  // Handle joining a chat room
  socket.on('joinRoom', ({ userId, receiverId }) => {
    const roomId = [userId, receiverId].sort().join('-');
    socket.join(roomId);
    userRooms.set(socket.id, roomId);
    console.log(`User ${userId} joined room ${roomId}`);
  });

  // Handle leaving a chat room
  socket.on('leaveRoom', ({ userId, receiverId }) => {
    const roomId = [userId, receiverId].sort().join('-');
    socket.leave(roomId);
    userRooms.delete(socket.id);
    console.log(`User ${userId} left room ${roomId}`);
  });

  // Handle sending messages
  socket.on('sendMessage', async (messageData) => {
    const { senderId, receiverId, message } = messageData;

    try {
      // Save message to database
      const Message = require('./models/Message');
      const newMessage = new Message({
        sender: senderId,
        receiver: receiverId,
        message: message,
        createdAt: new Date()
      });

      await newMessage.save();

      // Create room ID
      const roomId = [senderId, receiverId].sort().join('-');

      // Emit to room (including sender)
      io.to(roomId).emit('newMessage', {
        _id: newMessage._id,
        senderId: senderId,
        receiverId: receiverId,
        message: message,
        createdAt: newMessage.createdAt
      });

      console.log(`Message sent in room ${roomId}: ${message}`);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', ({ userId, receiverId }) => {
    const roomId = [userId, receiverId].sort().join('-');
    socket.to(roomId).emit('userTyping', { userId, isTyping: true });
    console.log(`User ${userId} is typing in room ${roomId}`);
  });

  // Handle stop typing
  socket.on('stopTyping', ({ userId, receiverId }) => {
    const roomId = [userId, receiverId].sort().join('-');
    socket.to(roomId).emit('userTyping', { userId, isTyping: false });
    console.log(`User ${userId} stopped typing in room ${roomId}`);
  });

  // Handle user going offline
  socket.on('userOffline', (userId) => {
    onlineUsers.delete(userId);
    console.log(`User ${userId} went offline`);

    // Broadcast updated online users list
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove user from online users if they were registered
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log(`User ${socket.userId} removed from online users`);

      // Broadcast updated online users list
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    }

    // Clean up room mapping
    userRooms.delete(socket.id);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));