const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const UserProgress = require('../models/UserProgress');
const quizService = require('../services/quizService');

class QuizController {
    // Get quiz for a subject
    async getQuiz(req, res) {
        try {
            const { subject } = req.params;
            const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f';

            const quiz = await quizService.generateQuiz(subject, userId);
            res.json(quiz); // Send the entire quiz object including _id and questions
        } catch (error) {
            console.error('Error getting quiz:', error);
            res.status(500).json({ error: 'Failed to generate quiz' });
        }
    }

    // Get quiz by ID
    async getQuizById(req, res) {
        try {
            const { quizId } = req.params;
            
            const quiz = await Quiz.findById(quizId);
            if (!quiz) {
                return res.status(404).json({ error: 'Quiz not found' });
            }

            res.json({ success: true, quiz });
        } catch (error) {
            console.error('Error getting quiz by ID:', error);
            res.status(500).json({ error: 'Failed to get quiz' });
        }
    }

    // Submit quiz attempt
    async submitQuiz(req, res) {
        try {
            const { quizId, answers } = req.body;
            // Use test user ID if no authenticated user (for testing)
            const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f';

            if (!quizId) {
                return res.status(400).json({ error: 'Quiz ID is required' });
            }
            
            if (!answers || !Array.isArray(answers)) {
                return res.status(400).json({ error: 'Answers are required and must be an array' });
            }

            console.log('Processing quiz submission:', { quizId, userId, answersCount: answers.length });

            const attempt = await quizService.submitQuizAttempt(userId, quizId, answers);
            
            // Fetch updated progress data
            const userProgress = await UserProgress.findOne({ user: userId }) || null;
            const quiz = await Quiz.findById(quizId);
            if (!quiz) {
                return res.status(404).json({ error: 'Quiz not found' });
            }

            let subjectProgress = null;
            if (userProgress && Array.isArray(userProgress.subjects)) {
                subjectProgress = userProgress.subjects.find(s => s.subject === quiz.subject) || null;
            }

            console.log('Quiz submission processed:', {
                score: attempt.score,
                subjectProgress: subjectProgress ? {
                    subject: subjectProgress.subject,
                    overallProgress: subjectProgress.overallProgress,
                    topicsCount: subjectProgress.topics.length
                } : null
            });

            res.json({ 
                attempt,
                progress: subjectProgress ? {
                    subject: subjectProgress.subject,
                    progress: subjectProgress.overallProgress,
                    topics: subjectProgress.topics.map(t => ({
                        topic: t.topic,
                        understanding: t.understanding
                    }))
                } : null
            });
        } catch (error) {
            console.error('Error submitting quiz:', error);
            res.status(500).json({ error: 'Failed to submit quiz' });
        }
    }

    // Get user's quiz history
    async getQuizHistory(req, res) {
        try {
            const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f';
            const attempts = await QuizAttempt.find({ user: userId })
                .populate('quiz')
                .sort({ completedAt: -1 });

            res.json({ attempts });
        } catch (error) {
            console.error('Error getting quiz history:', error);
            res.status(500).json({ error: 'Failed to get quiz history' });
        }
    }

    // Get user's progress dashboard
    async getProgressDashboard(req, res) {
        try {
            const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f';
            let userProgress = await UserProgress.findOne({ user: userId });
            if (!userProgress) {
                // Don't return early — allow attempted quiz data to be shown even if UserProgress is missing
                console.warn('No UserProgress found for user', userId, '- continuing to compute attempted subjects from QuizAttempt');
                userProgress = { overallGrowth: 0, subjects: [], studyPlan: [] };
            }

            // Calculate additional statistics and format data
            const dashboard = {
                overallGrowth: userProgress.overallGrowth || 0,
                subjects: userProgress.subjects.map(subject => ({
                    name: subject.subject,
                    progress: subject.overallProgress || 0,
                    topics: subject.topics.map(topic => ({
                        name: topic.topic,
                        understanding: topic.understanding || 0,
                        weakAreas: topic.weakAreas || [],
                        strongAreas: topic.strongAreas || [],
                        lastQuizDate: topic.lastQuizDate
                    })),
                    recentQuizzes: (subject.quizHistory || [])
                        .sort((a, b) => b.date - a.date)
                        .slice(0, 5)
                        .map(quiz => ({
                            date: quiz.date,
                            score: quiz.score
                        }))
                })),
                studyPlan: (userProgress.studyPlan || [])
                    .filter(item => item.status !== 'completed')
                    .sort((a, b) => {
                        if (a.priority === 'high' && b.priority !== 'high') return -1;
                        if (a.priority !== 'high' && b.priority === 'high') return 1;
                        return new Date(a.deadline) - new Date(b.deadline);
                    })
                    .map(item => ({
                        subject: item.subject,
                        topic: item.topic,
                        priority: item.priority,
                        deadline: item.deadline,
                        recommendedResources: item.recommendedResources || []
                    }))
            };

            // Compute attempted-subject statistics from QuizAttempt (group by quiz.subject)
            try {
                const attempts = await QuizAttempt.find({ user: userId }).populate('quiz').lean();
                const map = new Map();
                attempts.forEach(a => {
                    const subj = a.quiz?.subject || 'Unknown';
                    const cur = map.get(subj) || { subject: subj, attempts: 0, totalScore: 0, lastAttempt: null };
                    cur.attempts += 1;
                    cur.totalScore += (typeof a.score === 'number' ? a.score : 0);
                    const d = a.completedAt || a.createdAt || new Date(0);
                    if (!cur.lastAttempt || new Date(d) > new Date(cur.lastAttempt)) cur.lastAttempt = d;
                    map.set(subj, cur);
                });

                const attemptedSubjects = Array.from(map.values()).map(s => ({
                    subject: s.subject,
                    attempts: s.attempts,
                    avgScore: s.attempts > 0 ? Math.round((s.totalScore / s.attempts) * 100) / 100 : 0,
                    lastAttempt: s.lastAttempt
                }));

                dashboard.attemptedSubjects = attemptedSubjects;
            } catch (e) {
                console.error('Error computing attempted subjects for dashboard:', e);
                dashboard.attemptedSubjects = [];
            }

            console.log('Sending dashboard data:', dashboard);
            res.json({ dashboard });
        } catch (error) {
            console.error('Error getting progress dashboard:', error);
            res.status(500).json({ error: 'Failed to get progress dashboard' });
        }
    }

    // Update study plan item status
    async updateStudyPlanStatus(req, res) {
        try {
            const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f';
            const { itemId, status } = req.body;

            const userProgress = await UserProgress.findOne({ user: userId });
            if (!userProgress) {
                return res.status(404).json({ error: 'No progress data found' });
            }

            const studyPlanItem = userProgress.studyPlan.id(itemId);
            if (!studyPlanItem) {
                return res.status(404).json({ error: 'Study plan item not found' });
            }

            studyPlanItem.status = status;
            await userProgress.save();

            res.json({ message: 'Study plan updated successfully' });
        } catch (error) {
            console.error('Error updating study plan:', error);
            res.status(500).json({ error: 'Failed to update study plan' });
        }
    }

    // Generate cold-start quiz using AI
    async generateColdStartQuiz(req, res) {
        try {
            const { subject } = req.params;
            const { totalQuestions = 10, useAdvanced = false } = req.query;
            // Allow anonymous cold-start: attach user only if logged in
            const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f'; // Test user for anonymous access

            console.log(`🚀 Generating cold-start quiz for ${subject} (advanced: ${useAdvanced})`);
            console.log(`🔍 useAdvanced type: ${typeof useAdvanced}, value: '${useAdvanced}'`);
            
            let quiz;
            if (useAdvanced === 'true') {
                // Use the high-quality advanced generation
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
                    questions: questions,
                    quizType: 'cold_start',
                    generationMethod: 'ai_generated'
                };
                
                // Ensure questions have proper source information and include _id
                quiz.questions = quiz.questions.map((q, index) => ({
                    ...q,
                    _id: quizDoc.questions[index]._id, // Include the MongoDB _id
                    source: q.source || 'ml_enhanced',
                    generationMethod: 'ml_enhanced'
                }));
            } else {
                // Use existing cold-start generation
                quiz = await quizService.generateColdStartQuiz(subject, userId, parseInt(totalQuestions));
            }
            
            res.json({
                success: true,
                quiz,
                message: `Cold-start quiz generated for ${subject}`
            });
        } catch (error) {
            console.error('Error generating cold-start quiz:', error);
            res.status(500).json({ 
                error: 'Failed to generate cold-start quiz',
                details: error.message 
            });
        }
    }

    // Generate adaptive quiz based on user performance
    async generateAdaptiveQuiz(req, res) {
        try {
            const { subject } = req.params;
            const { totalQuestions = 12 } = req.query;
            // Use test user ID if no authenticated user (for testing)
            const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f';

            console.log(`🧠 Generating adaptive quiz for ${subject}`);
            const quiz = await quizService.generateAdaptiveQuiz(subject, userId, parseInt(totalQuestions));
            
            res.json({
                success: true,
                quiz,
                message: `Adaptive quiz generated for ${subject}`
            });
        } catch (error) {
            console.error('Error generating adaptive quiz:', error);
            res.status(500).json({ 
                error: 'Failed to generate adaptive quiz',
                details: error.message 
            });
        }
    }

    // Generate study plan
    async generateStudyPlan(req, res) {
        try {
            const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f';
            const { hoursPerWeek = 8, blockMinutes = 40, horizonWeeks = 2 } = req.body;

            console.log(`📅 Generating study plan for user ${userId}`);
            let studyPlan;
            try {
                studyPlan = await quizService.generateStudyPlan(
                    userId,
                    parseInt(hoursPerWeek),
                    parseInt(blockMinutes),
                    parseInt(horizonWeeks)
                );
            } catch (innerErr) {
                console.error('Primary studyPlan generation failed, attempting fallback plan generation:', innerErr && innerErr.stack ? innerErr.stack : innerErr);
                // Fallback: generate a generic plan using available topics with neutral performance
                const advancedQuizService = require('../services/advancedQuizService');
                const topics = advancedQuizService.getAvailableTopics();
                // Build a neutral performance object expected by advancedQuizService.generateStudyPlan
                const perf = { topic: {} };
                topics.forEach(t => {
                    perf.topic[t] = { accuracy: 0.5, seen: 0 };
                });
                try {
                    studyPlan = await advancedQuizService.generateStudyPlan(perf, parseInt(hoursPerWeek), parseInt(blockMinutes), parseInt(horizonWeeks));
                } catch (fallbackErr) {
                    console.error('Fallback study plan generation also failed:', fallbackErr && fallbackErr.stack ? fallbackErr.stack : fallbackErr);
                    throw fallbackErr;
                }
            }
            
            res.json({
                success: true,
                studyPlan,
                message: 'Study plan generated successfully'
            });
        } catch (error) {
            console.error('Error generating study plan:', error);
            res.status(500).json({ 
                error: 'Failed to generate study plan',
                details: error.message 
            });
        }
    }

    // Get available topics for quiz generation
    async getAvailableTopics(req, res) {
        try {
            const topics = await quizService.getAvailableTopics();
            
            res.json({
                success: true,
                topics,
                message: 'Available topics retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting available topics:', error);
            res.status(500).json({ 
                error: 'Failed to get available topics',
                details: error.message 
            });
        }
    }

    // Get quiz analytics
    async getQuizAnalytics(req, res) {
        try {
            const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f';
            const { subject } = req.params;

            console.log(`📊 Getting quiz analytics for user ${userId}${subject ? ` and subject ${subject}` : ''}`);
            const analytics = await quizService.getQuizAnalytics(userId, subject);
            
            res.json({
                success: true,
                analytics,
                message: 'Quiz analytics retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting quiz analytics:', error);
            res.status(500).json({ 
                error: 'Failed to get quiz analytics',
                details: error.message 
            });
        }
    }
}

module.exports = new QuizController(); 