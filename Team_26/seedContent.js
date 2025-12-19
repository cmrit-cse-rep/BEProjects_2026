require('dotenv').config();  // Load .env variables
const mongoose = require('mongoose');
const Content = require('./models/Content');  // Your Content model
const data = require('./data/sampleContent.json'); // Your JSON content array

async function seedDatabase() {
  try {
    // Connect to MongoDB using URI from .env
    await mongoose.connect(process.env.MONGO_URI);

    console.log('Connected to MongoDB...');

    // Clear existing content
    await Content.deleteMany({});
    console.log('Cleared old content');

    // Insert new content
    await Content.insertMany(data);
    console.log('Seeded content successfully!');

    // Disconnect
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();
