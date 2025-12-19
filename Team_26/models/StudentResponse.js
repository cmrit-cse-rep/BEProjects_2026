const mongoose = require('mongoose');

const StudentResponseSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
  },
  solving_id: {
    type: Number, // Learning session ID (from the bundle)
    required: true,
  },
  question_id: {
    type: String,
    required: true,
  },
  bundle_id: {
    type: String,
    required: true,
  },
  user_answer: {
    type: String,
    enum: ['a', 'b', 'c', 'd'],
    required: true,
  },
  elapsed_time: {
    type: Number, // in milliseconds
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you’ll have a User model
    required: false,
  }
});

module.exports = mongoose.model('StudentResponse', StudentResponseSchema);
