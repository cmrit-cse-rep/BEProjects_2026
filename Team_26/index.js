// index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Routes
const studentResponseRoutes = require('./routes/studentResponses');
const userRoutes = require('./routes/userRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const quizRoutes = require('./routes/quizRoutes');
const enhancedRoutes = require('./routes/enhancedRoutes');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // For JSON body parsing
app.use(express.urlencoded({ extended: true })); // For URL-encoded form data
app.use(cookieParser()); // To read JWT from cookies
app.use(express.static(path.join(__dirname, 'public')));

// EJS settings
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
// Robust MongoDB connect with retry/backoff to help diagnose transient DNS/connection errors
const connectWithRetry = async (uri, maxAttempts = 5) => {
  let attempt = 0;
  const baseDelay = 1000; // 1s
  while (attempt < maxAttempts) {
    try {
      attempt++;
      console.log(`MongoDB: connecting (attempt ${attempt}/${maxAttempts})...`);
      await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('✅ MongoDB Connected');
      return;
    } catch (err) {
      console.error(`❌ MongoDB connection attempt ${attempt} failed:`);
      console.error(err && err.stack ? err.stack : err);
      if (attempt >= maxAttempts) {
        console.error('❌ MongoDB failed to connect after max attempts. Continuing without DB — requests that need the DB will fail with a clear error.');
        return;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

connectWithRetry(process.env.MONGO_URI).catch(err => {
  console.error('Unexpected error during initial MongoDB connect:', err && err.stack ? err.stack : err);
});

// Track mongoose connection errors after initial connect attempt
mongoose.connection.on('error', err => {
  console.error('🔴 MongoDB connection error (event):', err && err.stack ? err.stack : err);
});

// Routes
app.use('/responses', studentResponseRoutes);
app.use('/users', userRoutes);
app.use('/', dashboardRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/enhanced', enhancedRoutes);

// Home route
app.get('/', (req, res) => {
  res.render('home');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
