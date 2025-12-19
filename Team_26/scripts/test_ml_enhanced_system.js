const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');

// Set JWT secret
process.env.JWT_SECRET = 'your-super-secret-jwt-key-here';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quizapp');

async function createTestUser() {
    try {
        let testUser = await User.findOne({ email: 'test@example.com' });
        if (!testUser) {
            testUser = await User.create({
                email: 'test@example.com',
                password: 'password123',
                fullname: 'Test User',
                subjects: ['Artificial Intelligence', 'Web Development', 'Data Structures']
            });
        }
        return testUser;
    } catch (error) {
        console.error('Error creating test user:', error);
        throw error;
    }
}

async function testMLEnhancedSystem() {
    try {
        console.log('🚀 Testing ML-Enhanced Quiz System...');
        
        // Ensure test user exists
        await createTestUser();
        
        // 1. Test ML-enhanced question generation
        console.log('\n📝 Testing ML-enhanced question generation...');
        const mlQuestionsResponse = await axios.get('http://localhost:5000/api/enhanced/high-quality/Artificial%20Intelligence', {
            params: { 
                difficulty: 'medium', 
                questionCount: 5 
            }
        });
        
        console.log('✅ ML Questions Generated:', mlQuestionsResponse.data.questions.length);
        console.log('📊 Question Quality Scores:', mlQuestionsResponse.data.questions.map(q => q.quality_score));
        
        // 2. Test enhanced dashboard
        console.log('\n📊 Testing enhanced dashboard...');
        const dashboardResponse = await axios.get('http://localhost:5000/api/enhanced/dashboard-test');
        
        if (dashboardResponse.data.success) {
            console.log('✅ Dashboard loaded successfully');
            console.log('📈 User Overview:', {
                totalQuizzes: dashboardResponse.data.dashboard.overview.totalQuizzes,
                averageScore: dashboardResponse.data.dashboard.overview.averageScore,
                improvementRate: dashboardResponse.data.dashboard.overview.improvementRate,
                streak: dashboardResponse.data.dashboard.overview.streak
            });
            console.log('🏆 Achievements:', dashboardResponse.data.dashboard.achievements.length);
            console.log('💡 Insights:', dashboardResponse.data.dashboard.insights.length);
            console.log('📚 Recommendations:', dashboardResponse.data.dashboard.recommendations.length);
        } else {
            console.log('❌ Dashboard failed:', dashboardResponse.data.error);
        }
        
        // 3. Test progress report
        console.log('\n📈 Testing progress report...');
        const progressResponse = await axios.get('http://localhost:5000/api/enhanced/progress-report-test/Artificial%20Intelligence');
        
        if (progressResponse.data.success) {
            console.log('✅ Progress report generated');
            console.log('📊 Report includes:', Object.keys(progressResponse.data.report));
        } else {
            console.log('❌ Progress report failed:', progressResponse.data.error);
        }
        
        // 4. Test adaptive quiz generation
        console.log('\n🧠 Testing enhanced adaptive quiz...');
        const adaptiveResponse = await axios.get('http://localhost:5000/api/enhanced/enhanced-adaptive/Artificial%20Intelligence', {
            params: { totalQuestions: 5 }
        });
        
        if (adaptiveResponse.data.success) {
            console.log('✅ Enhanced adaptive quiz generated');
            console.log('📝 Questions:', adaptiveResponse.data.quiz.questions.length);
        } else {
            console.log('❌ Enhanced adaptive quiz failed:', adaptiveResponse.data.error);
        }
        
        // 5. Test learning analytics
        console.log('\n📊 Testing learning analytics...');
        const analyticsResponse = await axios.get('http://localhost:5000/api/enhanced/analytics-test', {
            params: { timeframe: '30d' }
        });
        
        if (analyticsResponse.data.success) {
            console.log('✅ Learning analytics generated');
            console.log('📈 Analytics includes:', Object.keys(analyticsResponse.data.analytics));
        } else {
            console.log('❌ Learning analytics failed:', analyticsResponse.data.error);
        }
        
        console.log('\n🎉 ML-Enhanced System Test Complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    } finally {
        mongoose.disconnect();
    }
}

async function testPostSubmissionFlow() {
    try {
        console.log('\n🔄 Testing Post-Submission Flow...');
        
        // 1. Generate a quiz
        const quizResponse = await axios.get('http://localhost:5000/api/quiz/adaptive-test/Artificial%20Intelligence', {
            params: { totalQuestions: 3 }
        });
        
        const quiz = quizResponse.data.quiz;
        console.log('📝 Generated quiz:', quiz._id);
        
        // 2. Submit the quiz
        const answers = quiz.questions.map((q) => ({
            questionId: q._id,
            userAnswer: q.options[0],
            isCorrect: q.options[0] === q.correctAnswer,
            timeSpent: 10
        }));
        
        const submitResponse = await axios.post('http://localhost:5000/api/quiz/submit-test', {
            quizId: quiz._id,
            answers
        });
        
        console.log('✅ Quiz submitted successfully');
        console.log('📊 Score:', submitResponse.data.attempt.score);
        
        // 3. Get detailed feedback
        const attemptId = submitResponse.data.attempt._id;
        const feedbackResponse = await axios.get(`http://localhost:5000/api/enhanced/quiz-feedback-test/${attemptId}`);
        
        if (feedbackResponse.data.success) {
            console.log('✅ Detailed feedback generated');
            console.log('📝 Feedback includes:', Object.keys(feedbackResponse.data.feedback));
        } else {
            console.log('❌ Feedback generation failed:', feedbackResponse.data.error);
        }
        
        // 4. Check updated dashboard
        const updatedDashboard = await axios.get('http://localhost:5000/api/enhanced/dashboard-test');
        console.log('📊 Updated dashboard stats:', {
            totalQuizzes: updatedDashboard.data.dashboard.overview.totalQuizzes,
            averageScore: updatedDashboard.data.dashboard.overview.averageScore
        });
        
    } catch (error) {
        console.error('❌ Post-submission test failed:', error.response?.data || error.message);
    }
}

// Run tests
async function runAllTests() {
    await testMLEnhancedSystem();
    await testPostSubmissionFlow();
}

runAllTests();
