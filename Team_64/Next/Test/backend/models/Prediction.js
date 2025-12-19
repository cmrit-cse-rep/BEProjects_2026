const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  stockSymbol: {
    type: String,
    required: true,
    uppercase: true
  },
  modelType: {
    type: String,
    required: true,
    enum: ['ARIMA', 'LSTM', 'LinearRegression']
  },
  predictions: [{
    date: Date,
    predictedPrice: Number,
    confidenceInterval: {
      lower: Number,
      upper: Number
    }
  }],
  accuracy: {
    mse: Number,
    rmse: Number,
    mae: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  }
});

// Compound index for faster queries
predictionSchema.index({ stockSymbol: 1, modelType: 1 });
predictionSchema.index({ createdAt: -1 });

const Prediction = mongoose.model('Prediction', predictionSchema);
module.exports = Prediction; 