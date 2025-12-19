const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

// Set JWT secret
process.env.JWT_SECRET = 'your-super-secret-jwt-key-here';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quizapp');

async function createTestUser() {
    try {
        // Check if test user already exists
        let testUser = await User.findOne({ email: 'test@example.com' });
        
        if (!testUser) {
            // Create test user
            const bcrypt = require('bcrypt');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('testpassword', salt);
            
            testUser = await User.create({
                email: 'test@example.com',
                password: hash,
                fullname: 'Test User',
                subjects: ['Artificial Intelligence']
            });
            console.log('Created test user:', testUser.email);
        } else {
            console.log('Using existing test user:', testUser.email);
        }
        
        return testUser;
    } catch (error) {
        console.error('Error creating test user:', error);
        throw error;
    }
}

async function generateAuthToken(user) {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your-secret-key');
}

async function run() {
    try {
        // 1) Create or get test user
        const testUser = await createTestUser();
        
        // 2) Generate auth token
        const token = await generateAuthToken(testUser);
        
        // 3) Generate cold-start quiz
        const gen = await axios.get('http://localhost:5000/api/quiz/cold-start/Artificial%20Intelligence', {
            params: { totalQuestions: 5 }
        });
        const quiz = gen.data.quiz;
        console.log('Generated quiz id:', quiz._id, 'questions:', quiz.questions.length);

        // 4) Build answers
        const answers = quiz.questions.map((q) => ({
            questionId: q._id,
            userAnswer: q.options[0],
            isCorrect: q.options[0] === q.correctAnswer,
            timeSpent: 5
        }));

        // 5) Submit using test route (bypasses auth)
        const submit = await axios.post('http://localhost:5000/api/quiz/submit-test', {
            quizId: quiz._id,
            answers
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Submit status:', submit.status);
        console.log('Submit response:', submit.data);
        
        if (submit.data.error) {
            console.error('Error:', submit.data.error);
        } else {
            console.log('Attempt score:', submit.data.attempt?.score);
            console.log('Progress:', submit.data.progress);
        }
        
    } catch (e) {
        console.error('Test failed:', e.response?.data || e.message);
        if (e.response?.status === 302) {
            console.error('Got redirect - authentication failed');
        }
    } finally {
        mongoose.disconnect();
    }
}

run();
