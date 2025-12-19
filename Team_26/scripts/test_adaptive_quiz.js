const axios = require('axios');
const mongoose = require('mongoose');

// Set JWT secret
process.env.JWT_SECRET = 'your-super-secret-jwt-key-here';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quizapp');

async function testAdaptiveQuiz() {
    try {
        console.log('Testing adaptive quiz generation...');
        
        // Test the adaptive quiz generation using the test route
        const response = await axios.get('http://localhost:5000/api/quiz/adaptive-test/Artificial%20Intelligence', {
            params: { totalQuestions: 5 }
        });
        
        console.log('Status:', response.status);
        console.log('Response:', response.data);
        
    } catch (error) {
        console.error('Error testing adaptive quiz:', error.response?.data || error.message);
        if (error.response?.status === 302) {
            console.error('Got redirect - authentication failed');
        }
    } finally {
        mongoose.disconnect();
    }
}

testAdaptiveQuiz();
