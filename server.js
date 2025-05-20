const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app); // Socket.io uchun HTTP server

// Socket.io sozlamalari
const io = new Server(server, {
  cors: {
    origin: '*', // Frontenddan kirishga ruxsat
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB ulanishi
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB ulanishi muvaffaqiyatli'))
  .catch(err => console.error(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/upload'));

// Socket.io logic
io.on('connection', (socket) => {
  console.log('Foydalanuvchi ulandi:', socket.id);

  // Chatga qo‘shilish (userId orqali room)
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Xabar yuborish
  socket.on('send_message', ({ senderId, receiverId, message }) => {
    console.log(`Xabar yuborildi: ${message} (Kimdan: ${senderId} -> Kimga: ${receiverId})`);

    io.to(receiverId).emit('receive_message', {
      senderId,
      message,
      timestamp: new Date()
    });
  });

  // Ulanish uzildi
  socket.on('disconnect', () => {
    console.log('Foydalanuvchi chiqdi:', socket.id);
  });
});

// Portda serverni ishga tushurish
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server ${PORT}-portda ishlayapti`));
