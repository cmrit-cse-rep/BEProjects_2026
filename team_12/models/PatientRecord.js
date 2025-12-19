const mongoose = require('mongoose');

const patientRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  patientEmail: {
    type: String,
    trim: true,
    default: null
  },
  doctorEmail: {
    type: String,
    trim: true,
    required: true
  },
  patientAge: {
    type: Number,
    default: null
  },
  symptoms: {
    type: String,
    default: 'Not provided',
    trim: true
  },
  sourceType: {
    type: String,
    enum: ['file', 'manual', 'ocr', 'upload'],
    default: 'manual'
  },
  patientData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  originalModelPrediction: {
    prediction: Number,
    probability: Number,
    metrics: {
      accuracy: Number,
      precision: Number,
      recall: Number,
      f1_score: Number
    }
  },
  vaeModelPrediction: {
    prediction: Number,
    probability: Number,
    metrics: {
      accuracy: Number,
      precision: Number,
      recall: Number,
      f1_score: Number
    }
  },
  sepsisDetected: {
    type: Boolean,
    required: true
  },
  suggestions: [{
    type: String
  }],
  reportPath: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PatientRecord', patientRecordSchema);

