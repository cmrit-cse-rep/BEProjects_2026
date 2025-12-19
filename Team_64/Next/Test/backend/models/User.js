const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    validate: {
      validator: (v) => /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(v)
    }
  },
  watchlist: [{
    symbol: String,
    addedAt: { type: Date, default: Date.now }
  }],
  predictionHistory: [{
    symbol: String,
    predictedPrice: Number,
    actualPrice: Number,
    predictedAt: { type: Date, default: Date.now }
  }],
  portfolio: [{
    symbol: { type: String, required: true },
    quantity: { type: Number, required: true },
    buyPrice: { type: Number, required: true },
    buyDate: { type: String },
    currentPrice: { type: Number },
    createdAt: { type: Date, default: Date.now }
  }],
  portfolioHistory: [{
    action: { type: String, enum: ['create', 'update', 'delete'], required: true },
    symbol: String,
    quantity: Number,
    buyPrice: Number,
    buyDate: String,
    currentPrice: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;