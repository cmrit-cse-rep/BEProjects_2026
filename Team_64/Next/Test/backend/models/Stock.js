const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  historicalData: [{
    date: Date,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number,
    adjustedClose: Number
  }],
  technicalIndicators: {
    sma: [{
      period: Number,
      value: Number,
      date: Date
    }],
    rsi: [{
      value: Number,
      date: Date
    }],
    macd: [{
      macdLine: Number,
      signalLine: Number,
      histogram: Number,
      date: Date
    }]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
stockSchema.index({ symbol: 1 });
stockSchema.index({ 'historicalData.date': -1 });

const Stock = mongoose.model('Stock', stockSchema);
module.exports = Stock; 