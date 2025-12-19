const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  subjects: {
    type: [{
      type: String,
      enum: [
        'Data Structures',
        'Algorithms',
        'Operating Systems',
        'Computer Networks',
        'DBMS',
        'Machine Learning',
        'Artificial Intelligence',
        'Cybersecurity',
        'Web Development',
        'Cloud Computing',
      ],
    }],
    required: true,
    validate: {
      validator: function (v) {
        // Ensure at least 1 subject is selected
        return v.length >= 1;
      },
      message: 'Please select at least one subject.',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  interests: {
    type: Map,
    of: Number,
    default: {}
  }
});

module.exports = mongoose.model('User', userSchema);
