const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

const rawOrigins = process.env.CORS_ORIGIN || "http://localhost:3000";
const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean);

const originFn = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error('Not allowed by CORS'));
};

app.use(helmet());
app.use(cors({
  origin: originFn,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});


const stockRoutes = require('./routes/stocks');
const predictionRoutes = require('./routes/predictions');
const newsRoutes = require('./routes/news');
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');

app.use('/api/stocks', stockRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockprediction';
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).catch(err => {
  console.log("MongoDB connection failed, continuing without database:", err.message);
});

const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
});

connection.on('error', (err) => {
  console.log("MongoDB connection error:", err.message);
});

module.exports = app;