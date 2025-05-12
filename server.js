const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB ulandi');
    app.listen(process.env.PORT, () => {
      console.log(`Server ${process.env.PORT}-portda ishga tushdi`);
    });
  })
  .catch(err => console.log(err));
