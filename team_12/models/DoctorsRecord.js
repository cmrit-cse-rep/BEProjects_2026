const mongoose = require('mongoose');

const doctorsRecordSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
    trim: true,
  },
  patientEmail: {
    type: String,
    trim: true,
    default: null,
  },
  doctorEmail: {
    type: String,
    trim: true,
    required: true,
  },
  age: {
    type: Number,
    default: null,
  },
  symptoms: {
    type: String,
    default: 'Not provided',
    trim: true,
  },
  vitals: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  predictionResults: {
    originalModel: {
      prediction: Number,
      probability: Number,
      metrics: {
        accuracy: Number,
        precision: Number,
        recall: Number,
        f1_score: Number,
      },
    },
    vaeModel: {
      prediction: Number,
      probability: Number,
      metrics: {
        accuracy: Number,
        precision: Number,
        recall: Number,
        f1_score: Number,
      },
    },
  },
  predictionSummary: {
    type: String,
    trim: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  result: {
    type: String,
    enum: ['sepsis', 'normal'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DoctorsRecord', doctorsRecordSchema);


