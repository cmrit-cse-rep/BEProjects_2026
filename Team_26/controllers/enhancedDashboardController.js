const enhancedQuizService = require('../services/enhancedQuizService');
const UserProgress = require('../models/UserProgress');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');

class EnhancedDashboardController {
    constructor() {
        // Bind instance methods to ensure 'this' context is preserved
        this.getDashboard = this.getDashboard.bind(this);
        this.getProgressReport = this.getProgressReport.bind(this);
        this.getQuizFeedback = this.getQuizFeedback.bind(this);
        this.updateStudyPlan = this.updateStudyPlan.bind(this);
        this.getLearningAnalytics = this.getLearningAnalytics.bind(this);
        this.generateInsights = this.generateInsights.bind(this);
        this.generateRecommendations = this.generateRecommendations.bind(this);
        this.getUpcomingGoals = this.getUpcomingGoals.bind(this);
    }
    
    /**
     * Get comprehensive dashboard data
     */
    async getDashboard(req, res) {
        try {
            const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f';
            
            console.log('📊 Generating comprehensive dashboard...');
            
            // Get user profile and progress
            const userProfile = await enhancedQuizService.getUserProfile(userId);
            const recentAttempts = await EnhancedDashboardController.getRecentAttempts(userId, 10);
            const achievements = await EnhancedDashboardController.calculateAchievements(userId);
            const studyPlan = await EnhancedDashboardController.getCurrentStudyPlan(userId);
            
            const dashboard = {
                user: {
                    name: req.user?.fullname || 'Test User',
                    subjects: req.user?.subjects || ['Artificial Intelligence'],
                    joinDate: req.user?.createdAt || new Date()
                },
                overview: {
                    totalQuizzes: recentAttempts.length,
                    averageScore: EnhancedDashboardController.calculateAverageScore(recentAttempts),
                    improvementRate: EnhancedDashboardController.calculateImprovementRate(recentAttempts),
                    streak: EnhancedDashboardController.calculateStreak(recentAttempts),
                    timeSpent: EnhancedDashboardController.calculateTotalTimeSpent(recentAttempts)
                },
                progress: {
                    subjects: userProfile.progress?.subjects || [],
                    overallGrowth: userProfile.progress?.overallGrowth || 0,
                    lastUpdated: userProfile.progress?.lastUpdated || new Date()
                },
                recentActivity: EnhancedDashboardController.formatRecentActivity(recentAttempts),
                achievements: achievements,
                studyPlan: studyPlan,
                insights: await this.generateInsights(userId),
                recommendations: await this.generateRecommendations(userId),
                upcomingGoals: await this.getUpcomingGoals(userId)
            };
            
            console.log('📊 Dashboard generated successfully');
            res.json({
                success: true,
                dashboard: dashboard,
                message: 'Dashboard data retrieved successfully'
            });
            
        } catch (error) {
            console.error('❌ Error generating dashboard:', error);
            res.status(500).json({
                error: 'Failed to generate dashboard',
                details: error.message
            });
        }
    }

    /**
     * Get detailed progress report for a subject
     */
    async getProgressReport(req, res) {
        try {
            const { subject } = req.params;
            const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f';
            
            console.log(`📈 Generating progress report for ${subject}`);
            
            const report = await enhancedQuizService.generateProgressReport(userId, subject);
            
            res.json({
                success: true,
                report: report,
                message: `Progress report generated for ${subject}`
            });
            
        } catch (error) {
            console.error('❌ Error generating progress report:', error);
            res.status(500).json({
                error: 'Failed to generate progress report',
                details: error.message
            });
        }
    }

    /**
     * Get detailed feedback for a quiz attempt
     */
    async getQuizFeedback(req, res) {
        try {
            const { attemptId } = req.params;
            const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f';
            
            console.log(`💬 Generating detailed feedback for attempt ${attemptId}`);
            
            const attempt = await QuizAttempt.findById(attemptId)
                .populate('quiz')
                .populate('user');
            
            if (!attempt) {
                return res.status(404).json({ error: 'Quiz attempt not found' });
            }
            
            const feedback = await enhancedQuizService.generateDetailedFeedback(attempt);
            
            res.json({
                success: true,
                feedback: feedback,
                attempt: attempt,
                message: 'Detailed feedback generated successfully'
            });
            
        } catch (error) {
            console.error('❌ Error generating quiz feedback:', error);
            res.status(500).json({
                error: 'Failed to generate quiz feedback',
                details: error.message
            });
        }
    }

    /**
     * Update study plan based on performance
     */
    async updateStudyPlan(req, res) {
        try {
            const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f';
            const { subject, performance } = req.body;
            
            console.log(`📚 Updating study plan for ${subject}`);
            
            const updatedPlan = await enhancedQuizService.generateDynamicStudyPlan(userId, subject);
            
            // Save updated plan to user progress
            await this.saveStudyPlan(userId, subject, updatedPlan);
            
            res.json({
                success: true,
                studyPlan: updatedPlan,
                message: 'Study plan updated successfully'
            });
            
        } catch (error) {
            console.error('❌ Error updating study plan:', error);
            res.status(500).json({
                error: 'Failed to update study plan',
                details: error.message
            });
        }
    }

    /**
     * Get learning analytics
     */
    async getLearningAnalytics(req, res) {
        try {
            const userId = req.user ? req.user._id : '68d42a4118e6c0924aa7a30f';
            const { timeframe = '30d' } = req.query;
            
            console.log(`📊 Generating learning analytics for ${timeframe}`);
            
            const analytics = {
                performanceTrend: await this.getPerformanceTrend(userId, timeframe),
                subjectComparison: await this.getSubjectComparison(userId),
                difficultyProgression: await this.getDifficultyProgression(userId),
                timeAnalysis: await this.getTimeAnalysis(userId, timeframe),
                learningVelocity: await this.getLearningVelocity(userId),
                retentionRate: await this.getRetentionRate(userId),
                recommendations: await this.getAnalyticsRecommendations(userId)
            };
            
            res.json({
                success: true,
                analytics: analytics,
                message: 'Learning analytics generated successfully'
            });
            
        } catch (error) {
            console.error('❌ Error generating learning analytics:', error);
            res.status(500).json({
                error: 'Failed to generate learning analytics',
                details: error.message
            });
        }
    }

    // Helper methods
    static async getRecentAttempts(userId, limit = 10) {
        return await QuizAttempt.find({ user: userId })
            .sort({ completedAt: -1 })
            .limit(limit)
            .populate('quiz');
    }

    static calculateAverageScore(attempts) {
        if (attempts.length === 0) return 0;
        const total = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
        return Math.round(total / attempts.length);
    }

    static calculateImprovementRate(attempts) {
        if (attempts.length < 2) return 0;
        const scores = attempts.map(a => a.score).reverse();
        const improvements = scores.slice(1).map((score, i) => score - scores[i]);
        return improvements.reduce((a, b) => a + b, 0) / improvements.length;
    }

    static calculateStreak(attempts) {
        if (attempts.length === 0) return 0;
        
        let streak = 0;
        const today = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        
        for (let i = 0; i < attempts.length; i++) {
            const attemptDate = new Date(attempts[i].completedAt);
            const daysDiff = Math.floor((today - attemptDate) / oneDay);
            
            if (daysDiff === streak) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    static calculateTotalTimeSpent(attempts) {
        return attempts.reduce((total, attempt) => total + attempt.totalTimeSpent, 0);
    }

    static formatRecentActivity(attempts) {
        return attempts.map(attempt => ({
            id: attempt._id,
            quizTitle: attempt.quiz.title,
            subject: attempt.quiz.subject,
            score: attempt.score,
            completedAt: attempt.completedAt,
            timeSpent: attempt.totalTimeSpent,
            type: 'quiz_completed'
        }));
    }

    static async calculateAchievements(userId) {
        const attempts = await this.getRecentAttempts(userId, 50);
        const achievements = [];
        
        // Perfect Score Achievement
        const perfectScores = attempts.filter(a => a.score === 100).length;
        if (perfectScores > 0) {
            achievements.push({
                id: 'perfect_score',
                title: 'Perfect Score',
                description: `Achieved ${perfectScores} perfect score${perfectScores > 1 ? 's' : ''}`,
                icon: '🏆',
                unlocked: true
            });
        }
        
        // Streak Achievement
        const streak = this.calculateStreak(attempts);
        if (streak >= 7) {
            achievements.push({
                id: 'week_streak',
                title: 'Week Warrior',
                description: 'Maintained a 7-day study streak',
                icon: '🔥',
                unlocked: true
            });
        }
        
        // Improvement Achievement
        const improvementRate = this.calculateImprovementRate(attempts);
        if (improvementRate > 10) {
            achievements.push({
                id: 'improvement',
                title: 'Rising Star',
                description: 'Consistent improvement in performance',
                icon: '⭐',
                unlocked: true
            });
        }
        
        return achievements;
    }

    static async getCurrentStudyPlan(userId) {
        const userProgress = await UserProgress.findOne({ user: userId });
        return userProgress?.studyPlan || [];
    }

    async generateInsights(userId) {
        const userProfile = await enhancedQuizService.getUserProfile(userId);
        const insights = [];
        
        // Performance insights
        if (userProfile.learningPatterns.improvementRate > 0.1) {
            insights.push({
                type: 'positive',
                title: 'Great Progress!',
                message: 'Your performance is improving consistently. Keep up the excellent work!',
                icon: '📈'
            });
        }
        
        // Study pattern insights
        if (userProfile.learningPatterns.consistency > 0.7) {
            insights.push({
                type: 'info',
                title: 'Consistent Learner',
                message: 'You maintain consistent study patterns. This is great for long-term retention.',
                icon: '🎯'
            });
        }
        
        return insights;
    }

    async generateRecommendations(userId) {
        const userProfile = await enhancedQuizService.getUserProfile(userId);
        const recommendations = [];
        
        // Difficulty recommendations
        if (userProfile.preferredDifficulty === 'easy') {
            recommendations.push({
                type: 'challenge',
                title: 'Ready for a Challenge?',
                message: 'Try increasing the difficulty level to accelerate your learning.',
                action: 'increase_difficulty'
            });
        }
        
        // Study frequency recommendations
        const recentAttempts = await this.getRecentAttempts(userId, 7);
        if (recentAttempts.length < 3) {
            recommendations.push({
                type: 'frequency',
                title: 'Increase Study Frequency',
                message: 'More regular practice sessions will help improve retention.',
                action: 'schedule_more_sessions'
            });
        }
        
        return recommendations;
    }

    async getUpcomingGoals(userId) {
        const userProfile = await enhancedQuizService.getUserProfile(userId);
        const goals = [];
        
        // Performance goals
        const averageScore = this.calculateAverageScore(userProfile.recentAttempts);
        if (averageScore < 80) {
            goals.push({
                id: 'score_improvement',
                title: 'Improve Average Score',
                target: 80,
                current: averageScore,
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                type: 'performance'
            });
        }
        
        // Consistency goals
        const streak = this.calculateStreak(userProfile.recentAttempts);
        if (streak < 7) {
            goals.push({
                id: 'week_streak',
                title: '7-Day Study Streak',
                target: 7,
                current: streak,
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                type: 'consistency'
            });
        }
        
        return goals;
    }

    async saveStudyPlan(userId, subject, studyPlan) {
        let userProgress = await UserProgress.findOne({ user: userId });
        
        if (!userProgress) {
            userProgress = new UserProgress({
                user: userId,
                subjects: [],
                studyPlan: []
            });
        }
        
        // Update or add study plan
        const existingPlanIndex = userProgress.studyPlan.findIndex(plan => plan.subject === subject);
        if (existingPlanIndex >= 0) {
            userProgress.studyPlan[existingPlanIndex] = {
                subject: subject,
                plan: studyPlan,
                lastUpdated: new Date()
            };
        } else {
            userProgress.studyPlan.push({
                subject: subject,
                plan: studyPlan,
                lastUpdated: new Date()
            });
        }
        
        await userProgress.save();
    }
}

module.exports = new EnhancedDashboardController();
