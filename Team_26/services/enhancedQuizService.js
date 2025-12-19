const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class EnhancedQuizService {
    constructor() {
        this.pythonScriptPath = path.join(__dirname, 'enhanced_quiz_generator.py');
        this.pythonEnvPath = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe');
        this.fallbackPythonPath = 'python3';
    }

    /**
     * Generate high-quality questions with Bloom's taxonomy integration
     */
    async generateHighQualityQuestions(topics, difficulty = 'medium', questionCount = 10) {
        try {
            console.log('🎯 Generating high-quality questions with Bloom\'s taxonomy');
            
            const pythonPath = await this.checkPythonEnvironment();
            
            const inputData = {
                topics: topics,
                difficulty: difficulty,
                question_count: questionCount,
                bloom_levels: ['remember', 'understand', 'apply', 'analyze', 'evaluate'],
                quality_metrics: {
                    clarity: 0.9,
                    relevance: 0.9,
                    difficulty_consistency: 0.8,
                    educational_value: 0.9
                }
            };
            
            const tempInputPath = path.join(__dirname, 'temp_enhanced_input.json');
            await fs.writeFile(tempInputPath, JSON.stringify(inputData));
            
            // Force UTF-8 for Python execution
            process.env.PYTHONUTF8 = '1';
            process.env.PYTHONIOENCODING = 'utf-8';
            const result = await this.executePythonScript(pythonPath, [
                this.pythonScriptPath,
                tempInputPath
            ]);
            
            await fs.unlink(tempInputPath).catch(() => {});
            
            // Extract pure JSON from stdout (strip any accidental logs)
            const out = result.toString('utf8');
            
            // Find the start of actual JSON array (handle Windows line endings)
            const jsonStart = out.indexOf('[\r\n');
            
            if (jsonStart === -1) {
                throw new Error('No JSON array found in Python output');
            }
            
            // Extract from the start of JSON array to the end
            const jsonPayload = out.slice(jsonStart);
            const questions = JSON.parse(jsonPayload);
            console.log(`✅ Generated ${questions.length} high-quality questions`);
            return questions;
            
        } catch (error) {
            console.error('❌ Error generating high-quality questions:', error);
            throw new Error(`Failed to generate high-quality questions: ${error.message}`);
        }
    }

    /**
     * Advanced adaptive algorithm with machine learning
     */
    async generateAdaptiveQuizAdvanced(userId, subject, totalQuestions = 12) {
        try {
            console.log('🧠 Generating advanced adaptive quiz');
            
            // Get comprehensive user profile
            const userProfile = await this.getUserProfile(userId);
            const performanceHistory = await this.getPerformanceHistory(userId, subject);
            const learningStyle = await this.detectLearningStyle(userId);
            
            // Calculate adaptive parameters
            const adaptiveParams = this.calculateAdaptiveParameters(userProfile, performanceHistory, learningStyle);
            
            // Generate personalized questions
            const questions = await this.generatePersonalizedQuestions(subject, adaptiveParams, totalQuestions);
            
            // Apply spaced repetition algorithm
            const spacedQuestions = await this.applySpacedRepetition(questions, userProfile);
            
            return spacedQuestions;
            
        } catch (error) {
            console.error('❌ Error generating advanced adaptive quiz:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive user profile
     */
    async getUserProfile(userId) {
        const UserProgress = require('../models/UserProgress');
        const QuizAttempt = require('../models/QuizAttempt');
        
        const userProgress = await UserProgress.findOne({ user: userId });
        const recentAttempts = await QuizAttempt.find({ user: userId })
            .sort({ completedAt: -1 })
            .limit(20)
            .populate('quiz');
        
        return {
            progress: userProgress,
            recentAttempts: recentAttempts,
            learningPatterns: this.analyzeLearningPatterns(recentAttempts),
            strengths: this.identifyStrengths(recentAttempts),
            weaknesses: this.identifyWeaknesses(recentAttempts),
            preferredDifficulty: this.calculatePreferredDifficulty(recentAttempts),
            responseTimePattern: this.analyzeResponseTimePattern(recentAttempts)
        };
    }

    /**
     * Identify user strengths from quiz attempts
     */
    identifyStrengths(attempts) {
        const strengths = [];
        const subjectScores = {};
        
        attempts.forEach(attempt => {
            const subject = attempt.quiz?.subject || 'Unknown';
            if (!subjectScores[subject]) {
                subjectScores[subject] = [];
            }
            subjectScores[subject].push(attempt.score);
        });
        
        Object.keys(subjectScores).forEach(subject => {
            const avgScore = subjectScores[subject].reduce((a, b) => a + b, 0) / subjectScores[subject].length;
            if (avgScore >= 70) {
                strengths.push(subject);
            }
        });
        
        return strengths;
    }

    /**
     * Identify user weaknesses from quiz attempts
     */
    identifyWeaknesses(attempts) {
        const weaknesses = [];
        const subjectScores = {};
        
        attempts.forEach(attempt => {
            const subject = attempt.quiz?.subject || 'Unknown';
            if (!subjectScores[subject]) {
                subjectScores[subject] = [];
            }
            subjectScores[subject].push(attempt.score);
        });
        
        Object.keys(subjectScores).forEach(subject => {
            const avgScore = subjectScores[subject].reduce((a, b) => a + b, 0) / subjectScores[subject].length;
            if (avgScore < 50) {
                weaknesses.push(subject);
            }
        });
        
        return weaknesses;
    }

    /**
     * Calculate preferred difficulty based on performance
     */
    calculatePreferredDifficulty(attempts) {
        if (attempts.length === 0) return 'medium';
        
        const scores = attempts.map(a => a.score);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        if (avgScore >= 80) return 'hard';
        if (avgScore >= 60) return 'medium';
        return 'easy';
    }

    /**
     * Analyze response time patterns
     */
    analyzeResponseTimePattern(attempts) {
        if (attempts.length === 0) return { avgTime: 30, consistency: 0.5 };
        
        const times = attempts.map(a => a.totalTimeSpent || 0);
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        
        // Calculate consistency (lower variance = higher consistency)
        const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;
        const consistency = Math.max(0, 1 - (variance / (avgTime * avgTime)));
        
        return { avgTime, consistency };
    }

    /**
     * Analyze learning patterns from user data
     */
    analyzeLearningPatterns(attempts) {
        const patterns = {
            improvementRate: 0,
            consistency: 0,
            difficultyPreference: 'medium',
            timeOfDay: 'morning',
            sessionLength: 15
        };
        
        if (attempts.length < 2) return patterns;
        
        // Calculate improvement rate
        const scores = attempts.map(a => a.score);
        const improvement = scores.slice(0, -1).map((score, i) => scores[i + 1] - score);
        patterns.improvementRate = improvement.reduce((a, b) => a + b, 0) / improvement.length;
        
        // Calculate consistency
        const variance = this.calculateVariance(scores);
        patterns.consistency = 1 - (variance / 100); // Higher consistency = lower variance
        
        // Analyze difficulty preference
        const difficulties = attempts.map(a => a.quiz.difficulty);
        patterns.difficultyPreference = this.getMostFrequent(difficulties);
        
        return patterns;
    }

    /**
     * Calculate adaptive parameters based on user profile
     */
    calculateAdaptiveParameters(userProfile, performanceHistory, learningStyle) {
        const params = {
            difficultyDistribution: [0.3, 0.5, 0.2], // easy, medium, hard
            bloomLevelDistribution: [0.2, 0.3, 0.3, 0.15, 0.05], // remember to create
            questionTypes: ['mcq', 'true_false', 'fill_blank'],
            timeLimit: 60, // seconds per question
            hintsEnabled: true,
            explanationLevel: 'detailed'
        };
        
        // Adjust based on user performance
        if (userProfile.learningPatterns.improvementRate > 0.1) {
            // User is improving, increase difficulty
            params.difficultyDistribution = [0.2, 0.4, 0.4];
        } else if (userProfile.learningPatterns.improvementRate < -0.1) {
            // User is struggling, decrease difficulty
            params.difficultyDistribution = [0.5, 0.4, 0.1];
        }
        
        // Adjust based on learning style
        if (learningStyle === 'visual') {
            params.questionTypes.push('diagram', 'chart');
        } else if (learningStyle === 'kinesthetic') {
            params.questionTypes.push('interactive', 'simulation');
        }
        
        return params;
    }

    /**
     * Generate comprehensive progress report
     */
    async generateProgressReport(userId, subject) {
        try {
            const userProfile = await this.getUserProfile(userId);
            const subjectProgress = userProfile.progress?.subjects.find(s => s.subject === subject);
            
            const report = {
                overallScore: subjectProgress?.overallProgress || 0,
                improvementTrend: this.calculateImprovementTrend(userProfile.recentAttempts),
                strengths: userProfile.strengths,
                weaknesses: userProfile.weaknesses,
                recommendations: this.generateRecommendations(userProfile),
                nextSteps: this.generateNextSteps(userProfile, subject),
                studyPlan: await this.generateDynamicStudyPlan(userId, subject),
                insights: this.generateInsights(userProfile),
                achievements: this.calculateAchievements(userProfile),
                goals: this.suggestGoals(userProfile, subject)
            };
            
            return report;
            
        } catch (error) {
            console.error('❌ Error generating progress report:', error);
            throw error;
        }
    }

    /**
     * Generate dynamic study plan
     */
    async generateDynamicStudyPlan(userId, subject) {
        try {
            const userProfile = await this.getUserProfile(userId);
            const weaknesses = userProfile.weaknesses;
            const learningPatterns = userProfile.learningPatterns;
            
            const studyPlan = {
                dailyGoals: this.generateDailyGoals(weaknesses),
                weeklySchedule: this.generateWeeklySchedule(learningPatterns),
                resources: await this.recommendResources(subject, weaknesses),
                practiceSessions: this.schedulePracticeSessions(weaknesses),
                milestones: this.setMilestones(subject, userProfile),
                adaptiveAdjustments: this.calculateAdaptiveAdjustments(userProfile)
            };
            
            return studyPlan;
            
        } catch (error) {
            console.error('❌ Error generating dynamic study plan:', error);
            throw error;
        }
    }

    /**
     * Generate detailed feedback for quiz attempts
     */
    async generateDetailedFeedback(quizAttempt) {
        const feedback = {
            overallPerformance: this.analyzeOverallPerformance(quizAttempt),
            questionAnalysis: this.analyzeIndividualQuestions(quizAttempt),
            timeAnalysis: this.analyzeTimeUsage(quizAttempt),
            improvementAreas: this.identifyImprovementAreas(quizAttempt),
            strengths: this.identifyStrengths([quizAttempt]),
            recommendations: this.generateActionableRecommendations(quizAttempt),
            nextQuizSuggestion: this.suggestNextQuiz(quizAttempt),
            motivationalMessage: this.generateMotivationalMessage(quizAttempt)
        };
        
        return feedback;
    }

    // Helper methods
    calculateVariance(scores) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
        return variance;
    }

    getMostFrequent(arr) {
        return arr.sort((a, b) =>
            arr.filter(v => v === a).length - arr.filter(v => v === b).length
        ).pop();
    }

    generateMotivationalMessage(quizAttempt) {
        const score = quizAttempt.score;
        if (score >= 80) {
            return "Excellent work! You're mastering this subject. Keep up the great progress!";
        } else if (score >= 60) {
            return "Good job! You're making solid progress. Focus on the areas that need improvement.";
        } else if (score >= 40) {
            return "You're on the right track! Review the concepts and try again. Every attempt is a learning opportunity.";
        } else {
            return "Don't give up! Learning takes time. Review the fundamentals and practice more. You've got this!";
        }
    }

    async checkPythonEnvironment() {
        try {
            await fs.access(this.pythonEnvPath);
            return this.pythonEnvPath;
        } catch {
            return this.fallbackPythonPath;
        }
    }

    async executePythonScript(pythonPath, args) {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn(pythonPath, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: path.dirname(this.pythonScriptPath)
            });

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(new Error(`Python script failed with code ${code}: ${stderr}`));
                }
            });

            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }
// Remove premature class closing so appended methods remain inside the class

    /**
     * Generate personalized questions
     */
    async generatePersonalizedQuestions(subject, adaptiveParams, totalQuestions) {
        // This would integrate with the ML question generator
        return await this.generateHighQualityQuestions([subject], adaptiveParams.difficultyDistribution[1], totalQuestions);
    }

    /**
     * Apply spaced repetition algorithm
     */
    async applySpacedRepetition(questions, userProfile) {
        // Implement spaced repetition logic
        return questions;
    }

    /**
     * Generate daily goals based on weaknesses
     */
    generateDailyGoals(weaknesses) {
        return weaknesses.map(weakness => ({
            subject: weakness,
            goal: `Improve understanding in ${weakness}`,
            target: 'Complete 5 practice questions',
            priority: 'high'
        }));
    }

    /**
     * Generate weekly schedule based on learning patterns
     */
    generateWeeklySchedule(learningPatterns) {
        return {
            monday: { subject: 'Artificial Intelligence', duration: 30 },
            tuesday: { subject: 'Web Development', duration: 45 },
            wednesday: { subject: 'Data Structures', duration: 30 },
            thursday: { subject: 'Review', duration: 20 },
            friday: { subject: 'Practice', duration: 40 },
            saturday: { subject: 'Assessment', duration: 60 },
            sunday: { subject: 'Rest', duration: 0 }
        };
    }

    /**
     * Recommend resources based on subject and weaknesses
     */
    async recommendResources(subject, weaknesses) {
        return [
            {
                type: 'video',
                title: `${subject} Fundamentals`,
                url: '#',
                duration: '30 min',
                difficulty: 'beginner'
            },
            {
                type: 'article',
                title: `Advanced ${subject} Concepts`,
                url: '#',
                readingTime: '15 min',
                difficulty: 'intermediate'
            },
            {
                type: 'practice',
                title: `${subject} Practice Problems`,
                url: '#',
                questions: 20,
                difficulty: 'mixed'
            }
        ];
    }

    /**
     * Schedule practice sessions
     */
    schedulePracticeSessions(weaknesses) {
        return weaknesses.map(weakness => ({
            subject: weakness,
            sessionType: 'practice',
            duration: 25,
            frequency: 'daily',
            nextSession: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }));
    }

    /**
     * Set learning milestones
     */
    setMilestones(subject, userProfile) {
        return [
            {
                title: `Master ${subject} Basics`,
                target: '80% accuracy',
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                progress: 0
            },
            {
                title: `Complete ${subject} Intermediate`,
                target: '85% accuracy',
                deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                progress: 0
            },
            {
                title: `Achieve ${subject} Expert`,
                target: '90% accuracy',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                progress: 0
            }
        ];
    }

    /**
     * Calculate adaptive adjustments
     */
    calculateAdaptiveAdjustments(userProfile) {
        return {
            difficultyAdjustment: userProfile.learningPatterns.improvementRate > 0.1 ? 'increase' : 'maintain',
            frequencyAdjustment: userProfile.learningPatterns.consistency < 0.5 ? 'increase' : 'maintain',
            topicFocus: userProfile.weaknesses.length > 0 ? userProfile.weaknesses[0] : 'balanced'
        };
    }

    /**
     * Analyze overall performance
     */
    analyzeOverallPerformance(quizAttempt) {
        const score = quizAttempt.score;
        let performance = 'excellent';
        
        if (score < 40) performance = 'needs_improvement';
        else if (score < 60) performance = 'developing';
        else if (score < 80) performance = 'good';
        
        return {
            level: performance,
            score: score,
            message: this.getPerformanceMessage(performance, score)
        };
    }

    /**
     * Get performance message
     */
    getPerformanceMessage(performance, score) {
        const messages = {
            excellent: `Outstanding! You scored ${score}% - you've mastered this topic!`,
            good: `Great job! You scored ${score}% - you're on the right track.`,
            developing: `Good effort! You scored ${score}% - keep practicing to improve.`,
            needs_improvement: `You scored ${score}% - let's focus on the fundamentals and practice more.`
        };
        return messages[performance];
    }

    /**
     * Analyze individual questions
     */
    analyzeIndividualQuestions(quizAttempt) {
        return quizAttempt.answers.map(answer => ({
            questionId: answer.questionId,
            correct: answer.isCorrect,
            timeSpent: answer.timeSpent,
            feedback: answer.isCorrect ? 'Correct!' : 'Incorrect - review this concept'
        }));
    }

    /**
     * Analyze time usage
     */
    analyzeTimeUsage(quizAttempt) {
        const totalTime = quizAttempt.totalTimeSpent;
        const avgTimePerQuestion = totalTime / quizAttempt.answers.length;
        
        return {
            totalTime: totalTime,
            avgTimePerQuestion: avgTimePerQuestion,
            efficiency: avgTimePerQuestion < 30 ? 'efficient' : 'needs_improvement',
            recommendation: avgTimePerQuestion > 60 ? 'Take your time to read questions carefully' : 'Good pacing!'
        };
    }

    /**
     * Identify improvement areas
     */
    identifyImprovementAreas(quizAttempt) {
        const incorrectAnswers = quizAttempt.answers.filter(a => !a.isCorrect);
        const improvementAreas = [];
        
        if (incorrectAnswers.length > quizAttempt.answers.length * 0.5) {
            improvementAreas.push('Fundamental concepts need review');
        }
        
        if (quizAttempt.totalTimeSpent > quizAttempt.answers.length * 60) {
            improvementAreas.push('Time management');
        }
        
        return improvementAreas;
    }

    /**
     * Generate actionable recommendations
     */
    generateActionableRecommendations(quizAttempt) {
        const recommendations = [];
        const score = quizAttempt.score;
        
        if (score < 50) {
            recommendations.push('Review fundamental concepts before attempting advanced topics');
            recommendations.push('Practice with easier questions to build confidence');
        } else if (score < 70) {
            recommendations.push('Focus on areas where you made mistakes');
            recommendations.push('Practice similar problems to reinforce learning');
        } else {
            recommendations.push('Great job! Try more challenging questions');
            recommendations.push('Help others learn by explaining concepts');
        }
        
        return recommendations;
    }

    /**
     * Suggest next quiz
     */
    suggestNextQuiz(quizAttempt) {
        const subject = quizAttempt.quiz.subject;
        const score = quizAttempt.score;
        
        if (score < 50) {
            return {
                type: 'review',
                subject: subject,
                difficulty: 'easy',
                message: 'Try an easier quiz to build confidence'
            };
        } else if (score >= 80) {
            return {
                type: 'challenge',
                subject: subject,
                difficulty: 'hard',
                message: 'Ready for a challenge? Try advanced questions'
            };
        } else {
            return {
                type: 'practice',
                subject: subject,
                difficulty: 'medium',
                message: 'Continue practicing to improve your score'
            };
        }
    }

    /**
     * Calculate improvement trend
     */
    calculateImprovementTrend(attempts) {
        if (attempts.length < 2) return 0;
        
        const scores = attempts.map(a => a.score).reverse();
        const improvements = scores.slice(1).map((score, i) => score - scores[i]);
        return improvements.reduce((a, b) => a + b, 0) / improvements.length;
    }

    /**
     * Generate insights
     */
    generateInsights(userProfile) {
        const insights = [];
        
        if (userProfile.learningPatterns.improvementRate > 0.1) {
            insights.push({
                type: 'positive',
                title: 'Great Progress!',
                message: 'Your performance is improving consistently. Keep up the excellent work!',
                icon: '📈'
            });
        }
        
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

    /**
     * Generate recommendations
     */
    generateRecommendations(userProfile) {
        const recommendations = [];
        
        if (userProfile.preferredDifficulty === 'easy') {
            recommendations.push({
                type: 'challenge',
                title: 'Ready for a Challenge?',
                message: 'Try increasing the difficulty level to accelerate your learning.',
                action: 'increase_difficulty'
            });
        }
        
        if (userProfile.recentAttempts.length < 3) {
            recommendations.push({
                type: 'frequency',
                title: 'Increase Study Frequency',
                message: 'More regular practice sessions will help improve retention.',
                action: 'schedule_more_sessions'
            });
        }
        
        return recommendations;
    }

    /**
     * Calculate achievements
     */
    calculateAchievements(userProfile) {
        const achievements = [];
        
        // Perfect Score Achievement
        const perfectScores = userProfile.recentAttempts.filter(a => a.score === 100).length;
        if (perfectScores > 0) {
            achievements.push({
                id: 'perfect_score',
                title: 'Perfect Score',
                description: `Achieved ${perfectScores} perfect score${perfectScores > 1 ? 's' : ''}`,
                icon: '🏆',
                unlocked: true
            });
        }
        
        // Improvement Achievement
        const improvementRate = this.calculateImprovementTrend(userProfile.recentAttempts);
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

    /**
     * Suggest goals
     */
    suggestGoals(userProfile, subject) {
        const goals = [];
        
        // Performance goals
        const recentScores = userProfile.recentAttempts.map(a => a.score);
        const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        
        if (avgScore < 80) {
            goals.push({
                id: 'score_improvement',
                title: 'Improve Average Score',
                target: 80,
                current: avgScore,
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                type: 'performance'
            });
        }
        
        return goals;
    }
}

module.exports = new EnhancedQuizService();
