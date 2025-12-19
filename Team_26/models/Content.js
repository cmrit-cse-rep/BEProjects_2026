// models/Content.js
const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  subject: { type: String, index: true },
  title: { type: String },
  description: { type: String },
  transcript: { type: String },
  chunks: { type: [String], default: [] },
  image: { type: String },
  link: { type: String },
  tags: { type: [String], default: [] },
  source: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Content', contentSchema);
