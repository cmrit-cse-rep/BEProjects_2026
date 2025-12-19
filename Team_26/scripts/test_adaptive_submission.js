const axios = require('axios');
const mongoose = require('mongoose');

// Set JWT secret
process.env.JWT_SECRET = 'your-super-secret-jwt-key-here';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quizapp');

async function testAdaptiveQuizSubmission() {
    try {
        console.log('Testing adaptive quiz generation and submission...');
        
        // 1) Generate adaptive quiz
        const quizResponse = await axios.get('http://localhost:5000/api/quiz/adaptive-test/Artificial%20Intelligence', {
            params: { totalQuestions: 3 }
        });
        
        const quiz = quizResponse.data.quiz;
        console.log('Generated quiz:', quiz._id);
        console.log('Questions count:', quiz.questions.length);
        
        // 2) Check if questions have _id fields
        console.log('Question IDs:', quiz.questions.map(q => q._id));
        
        // 3) Build answers
        const answers = quiz.questions.map((q) => ({
            questionId: q._id,
            userAnswer: q.options[0],
            isCorrect: q.options[0] === q.correctAnswer,
            timeSpent: 5
        }));
        
        console.log('Answer questionIds:', answers.map(a => a.questionId));
        
        // 4) Submit quiz
        const submitResponse = await axios.post('http://localhost:5000/api/quiz/submit-test', {
            quizId: quiz._id,
            answers
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Submit status:', submitResponse.status);
        console.log('Submit response:', submitResponse.data);
        
    } catch (error) {
        console.error('Error testing adaptive quiz submission:', error.response?.data || error.message);
    } finally {
        mongoose.disconnect();
    }
}

testAdaptiveQuizSubmission();
