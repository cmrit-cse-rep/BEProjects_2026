const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const isLoggedIn = require('../middleware/isLoggedIn');

// Apply authentication middleware to protected routes only
// Public routes (no auth required)
router.get('/topics', quizController.getAvailableTopics);
router.get('/advanced', (req, res) => {
    res.render('advanced-quiz');
});

// Advanced quiz generation endpoint
router.get('/advanced/generate', async (req, res) => {
    try {
        const { subject, totalQuestions = 10, quizType = 'cold_start' } = req.query;
        const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f'; // Test user for anonymous access
        
        if (!subject) {
            return res.status(400).json({ 
                success: false, 
                error: 'Subject is required' 
            });
        }

        console.log(`🚀 Generating advanced quiz for ${subject} (${quizType})`);
        
        let quiz;
        if (quizType === 'cold_start') {
            // Use the high-quality cold-start generation
            const advancedQuizService = require('../services/advancedQuizService');
            const topics = [subject];
            const questions = await advancedQuizService.generateColdStartQuiz(topics, parseInt(totalQuestions));
            
            // Create quiz document
            const Quiz = require('../models/Quiz');
            const quizDoc = await Quiz.create({
                subject: subject,
                title: `${subject} Advanced Quiz - ${new Date().toLocaleDateString()}`,
                description: `High-quality ${subject} quiz with ML-enhanced questions`,
                user: userId,
                difficulty: 'medium',
                quizType: 'cold_start',
                generationMethod: 'ai_generated',
                questions: questions
            });
            
            quiz = {
                _id: quizDoc._id,
                subject: quizDoc.subject,
                title: quizDoc.title,
                questions: questions.map((q, index) => ({
                    ...q,
                    _id: quizDoc.questions[index]._id // Include the MongoDB _id
                })),
                quizType: 'cold_start',
                generationMethod: 'ai_generated'
            };
        } else if (quizType === 'adaptive') {
            // Use existing adaptive quiz generation. If DB / adaptive generation fails, fall back to ML cold-start generator
            const quizService = require('../services/quizService');
            try {
                quiz = await quizService.generateAdaptiveQuiz(subject, userId, parseInt(totalQuestions));
            } catch (err) {
                console.error('Adaptive generation failed, falling back to ML cold-start:', err && err.stack ? err.stack : err);
                // Attempt ML cold-start directly (won't persist to DB if DB is unavailable)
                const advancedQuizService = require('../services/advancedQuizService');
                const questions = await advancedQuizService.generateColdStartQuiz([subject], parseInt(totalQuestions));
                // Return a transient quiz object (not saved)
                quiz = {
                    _id: null,
                    subject: subject,
                    title: `${subject} Adaptive (fallback) - ${new Date().toLocaleDateString()}`,
                    questions: questions,
                    quizType: 'adaptive',
                    generationMethod: 'ml_fallback'
                };
            }
        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid quiz type. Use "cold_start" or "adaptive"' 
            });
        }
        
        res.json({
            success: true,
            quiz,
            message: `Advanced ${quizType} quiz generated for ${subject}`
        });
    } catch (error) {
        console.error('Error generating advanced quiz:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to generate advanced quiz',
            details: error.message 
        });
    }
});
// Allow anonymous study-plan generation (fallback-friendly) before protected routes
router.post('/study-plan', quizController.generateStudyPlan);
router.get('/cold-start/:subject', quizController.generateColdStartQuiz);

// Test route (no auth required for testing)
router.post('/submit-test', quizController.submitQuiz);
router.get('/adaptive-test/:subject', quizController.generateAdaptiveQuiz);
router.get('/get/:quizId', quizController.getQuizById);

// Protected routes (auth required)
router.use(isLoggedIn);

// Get quiz for a subject
router.get('/generate/:subject', quizController.getQuiz);

// Generate adaptive quiz (personalized based on performance)
router.get('/adaptive/:subject', quizController.generateAdaptiveQuiz);

// Submit quiz attempt
router.post('/submit', quizController.submitQuiz);

// Get quiz history
router.get('/history', quizController.getQuizHistory);

// Get progress dashboard
router.get('/progress', quizController.getProgressDashboard);

// Generate study plan (protected version)
router.post('/study-plan', quizController.generateStudyPlan);

// Update study plan item status
router.put('/study-plan/:itemId', quizController.updateStudyPlanStatus);

// Get quiz analytics
router.get('/analytics', quizController.getQuizAnalytics);
router.get('/analytics/:subject', quizController.getQuizAnalytics);

module.exports = router; 