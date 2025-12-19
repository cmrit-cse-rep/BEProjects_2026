const express = require('express');
const router = express.Router();
const enhancedDashboardController = require('../controllers/enhancedDashboardController');
const enhancedQuizService = require('../services/enhancedQuizService');
const isLoggedIn = require('../middleware/isLoggedIn');

// Public routes (no auth required for testing)
router.get('/dashboard-test', enhancedDashboardController.getDashboard);

// Simple dashboard endpoint for testing
router.get('/dashboard-simple', async (req, res) => {
    try {
        const userId = '68d42a4118e6c0924aa7a30f'; // Test user
        
        console.log('📊 Generating simple dashboard...');
        
        // Get recent quiz attempts
        const QuizAttempt = require('../models/QuizAttempt');
        const recentAttempts = await QuizAttempt.find({ user: userId })
            .sort({ completedAt: -1 })
            .limit(10)
            .populate('quiz');
        
        // Calculate basic stats
        const totalQuizzes = recentAttempts.length;
        const averageScore = totalQuizzes > 0 ? 
            Math.round(recentAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalQuizzes) : 0;
        
        const dashboard = {
            user: {
                name: 'Test User',
                subjects: ['Artificial Intelligence', 'Data Structures'],
                joinDate: new Date()
            },
            overview: {
                totalQuizzes: totalQuizzes,
                averageScore: averageScore,
                improvementRate: 0,
                streak: 0,
                timeSpent: 0
            },
            recentActivity: recentAttempts.map(attempt => ({
                id: attempt._id,
                quizTitle: attempt.quiz?.title || 'Unknown Quiz',
                subject: attempt.quiz?.subject || 'Unknown Subject',
                score: attempt.score,
                completedAt: attempt.completedAt,
                timeSpent: attempt.totalTimeSpent || 0,
                type: 'quiz_completed'
            })),
            achievements: [],
            insights: [{
                type: 'info',
                title: 'Latest Attempt',
                message: totalQuizzes > 0 ? 
                    `You scored ${recentAttempts[0].score}% - ${recentAttempts[0].score >= 80 ? 'Great job!' : 'Let\'s focus on the fundamentals and practice more.'}` :
                    'No attempts yet - start your first quiz!',
                icon: '📊'
            }],
            recommendations: [],
            upcomingGoals: []
        };
        
        console.log('📊 Simple dashboard generated successfully');
        res.json({
            success: true,
            dashboard: dashboard,
            message: 'Simple dashboard data retrieved successfully'
        });
        
    } catch (error) {
        console.error('❌ Error generating simple dashboard:', error);
        res.status(500).json({
            error: 'Failed to generate simple dashboard',
            details: error.message
        });
    }
});
router.get('/progress-report-test/:subject', enhancedDashboardController.getProgressReport);
router.get('/quiz-feedback-test/:attemptId', enhancedDashboardController.getQuizFeedback);
router.post('/study-plan-test', enhancedDashboardController.updateStudyPlan);
router.get('/analytics-test', enhancedDashboardController.getLearningAnalytics);

// Protected routes (auth required)
router.use(isLoggedIn);

// Enhanced dashboard routes
router.get('/dashboard', enhancedDashboardController.getDashboard);
router.get('/progress-report/:subject', enhancedDashboardController.getProgressReport);
router.get('/quiz-feedback/:attemptId', enhancedDashboardController.getQuizFeedback);
router.post('/study-plan', enhancedDashboardController.updateStudyPlan);
router.get('/analytics', enhancedDashboardController.getLearningAnalytics);

// Enhanced quiz generation routes
router.get('/enhanced-adaptive/:subject', async (req, res) => {
    try {
        const { subject } = req.params;
        const { totalQuestions = 12 } = req.query;
        const userId = req.user._id;

        console.log(`🎯 Generating enhanced adaptive quiz for ${subject}`);
        const quiz = await enhancedQuizService.generateAdaptiveQuizAdvanced(userId, subject, parseInt(totalQuestions));
        
        res.json({
            success: true,
            quiz,
            message: `Enhanced adaptive quiz generated for ${subject}`
        });
    } catch (error) {
        console.error('Error generating enhanced adaptive quiz:', error);
        res.status(500).json({ 
            error: 'Failed to generate enhanced adaptive quiz',
            details: error.message 
        });
    }
});

router.get('/high-quality/:subject', async (req, res) => {
    try {
        const { subject } = req.params;
        const { difficulty = 'medium', questionCount = 10 } = req.query;

        console.log(`🎯 Generating high-quality questions for ${subject}`);
        const questions = await enhancedQuizService.generateHighQualityQuestions([subject], difficulty, parseInt(questionCount));
        
        res.json({
            success: true,
            questions,
            message: `High-quality questions generated for ${subject}`
        });
    } catch (error) {
        console.error('Error generating high-quality questions:', error);
        res.status(500).json({ 
            error: 'Failed to generate high-quality questions',
            details: error.message 
        });
    }
});

module.exports = router;
