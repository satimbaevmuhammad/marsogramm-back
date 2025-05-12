const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();


const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

// Atrof-muhit o'zgaruvchilarsiz yoziladi
const PORT = 5000;
const MONGO_URI = 'mongodb+srv://satimbaevmuhammad527:kRaeyoLNxTpyHO4V@cluster0.yv6d2th.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB ulandi');
    app.listen(PORT, () => {
      console.log(`Server ${PORT}-portda ishga tushdi`);
    });
  })
  .catch(err => console.log(err));
