const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const UserProgress = require('../models/UserProgress');
const advancedQuizService = require('./advancedQuizService');

class QuizService {
    async generateQuiz(subject, userId, difficulty = 'medium', quizType = 'practice') {
        try {
            console.log(`🎯 Generating ${quizType} quiz for ${subject} (${difficulty})`);
            
            // Get user's progress to determine appropriate questions
            const userProgress = await UserProgress.findOne({ user: userId });
            const subjectProgress = userProgress?.subjects.find(s => s.subject === subject);
            
            let questions = [];
            let generationMethod = 'manual';
            
            // Try advanced AI generation first
            try {
                if (quizType === 'cold_start' || quizType === 'adaptive') {
                    if (quizType === 'cold_start') {
                        // Generate cold-start quiz using AI
                        const topics = [subject];
                        questions = await advancedQuizService.generateColdStartQuiz(topics, 10);
                        generationMethod = 'ai_generated';
                    } else if (quizType === 'adaptive') {
                        // Generate adaptive quiz based on user performance
                        const studentPerf = this._formatStudentPerformance(userProgress, subject);
                        
                        // First get existing MCQ bank for this subject
                        const existingQuizzes = await Quiz.find({ 
                            subject: subject,
                            generationMethod: 'ai_generated'
                        }).limit(5);
                        
                        let mcqBank = [];
                        existingQuizzes.forEach(q => {
                            mcqBank = mcqBank.concat(q.questions);
                        });
                        
                        if (mcqBank.length === 0) {
                            // No existing questions, generate cold-start first
                            const topics = [subject];
                            mcqBank = await advancedQuizService.generateColdStartQuiz(topics, 15);
                        }
                        
                        questions = await advancedQuizService.generateAdaptiveQuiz(
                            mcqBank, 
                            studentPerf, 
                            12, 
                            [0.3, 0.5, 0.2]
                        );
                        generationMethod = 'ai_generated';
                    }
                }
            } catch (aiError) {
                console.warn('AI quiz generation failed, falling back to manual:', aiError.message);
            }
            
            // Fallback to manual generation if AI fails or for other quiz types
            if (questions.length === 0) {
                questions = await this._generateManualQuiz(subject, difficulty);
                generationMethod = 'manual';
            }
            
            // Create a new quiz document
            const quiz = await Quiz.create({
                subject: subject,
                title: `${subject} Quiz - ${new Date().toLocaleDateString()}`,
                description: `A ${difficulty} difficulty ${quizType} quiz on ${subject}`,
                user: userId,
                difficulty: difficulty,
                quizType: quizType,
                generationMethod: generationMethod,
                questions: questions
            });

            console.log(`✅ Generated ${questions.length} questions using ${generationMethod} method`);
            return {
                _id: quiz._id,
                questions: questions,
                metadata: quiz.metadata,
                quizType: quizType,
                generationMethod: generationMethod
            };
        } catch (error) {
            console.error('Error generating quiz:', error);
            throw error;
        }
    }
    
    async _generateManualQuiz(subject, difficulty) {
        // Query questions based on subject and difficulty
        const questions = await Quiz.aggregate([
            { $match: { subject: subject } },
            { $unwind: '$questions' },
            { $match: { 'questions.difficulty': difficulty } },
            { $sample: { size: 10 } }, // Get 10 random questions
            { $group: {
                _id: null,
                questions: { $push: '$questions' }
            }}
        ]);

        if (!questions.length || !questions[0].questions.length) {
            throw new Error('No questions available for this subject');
        }

        return questions[0].questions;
    }
    
    _formatStudentPerformance(userProgress, subject) {
        const subjectProgress = userProgress?.subjects.find(s => s.subject === subject);
        if (!subjectProgress) {
            return {
                topic: {
                    [subject]: {
                        accuracy: 0.5,
                        seen: 0
                    }
                }
            };
        }
        
        const topicPerf = {};
        subjectProgress.topics.forEach(topic => {
            topicPerf[topic.topic] = {
                accuracy: topic.understanding / 100, // Convert to 0-1 scale
                seen: topic.quizzesTaken || 0
            };
        });
        
        // Add overall subject performance
        topicPerf[subject] = {
            accuracy: subjectProgress.overallProgress / 100,
            seen: subjectProgress.quizHistory?.length || 0
        };
        
        return { topic: topicPerf };
    }

    async submitQuizAttempt(userId, quizId, answers) {
        
        try {
            if (!quizId) {
            throw new Error('Quiz ID is required');
        }
        console.log('submitQuizAttempt called with quizId:', quizId);
            const quiz = await Quiz.findById(quizId);
            if (!quiz) {
                throw new Error('Quiz not found');
            }

            // Calculate score and analyze answers
            const analysis = this._analyzeQuizAttempt(quiz.questions, answers);
            
            // Create quiz attempt record
            const attempt = await QuizAttempt.create({
                user: userId,
                quiz: quizId,
                answers: answers,
                score: analysis.score,
                totalTimeSpent: answers.reduce((total, ans) => total + ans.timeSpent, 0),
                analysis: {
                    strengths: analysis.strengths,
                    weaknesses: analysis.weaknesses,
                    recommendedTopics: analysis.recommendedTopics,
                    difficultyLevel: analysis.difficultyLevel,
                    understandingLevel: analysis.understandingLevel
                }
            });

            // Update user progress
            await this._updateUserProgress(userId, quiz.subject, analysis);

            return attempt;
        } catch (error) {
            console.error('Error submitting quiz attempt:', error);
            throw error;
        }
    }

    _analyzeQuizAttempt(questions, answers) {
        const analysis = {
            score: 0,
            strengths: [],
            weaknesses: [],
            recommendedTopics: [],
            difficultyLevel: 'medium',
            understandingLevel: 0
        };

        const topicPerformance = new Map();
        let totalCorrect = 0;

        answers.forEach(answer => {
            const question = questions.find(q => {
                try {
                    return q._id && answer.questionId && q._id.toString() === answer.questionId.toString();
                } catch {
                    return false;
                }
            });
            if (!question) return;

            // Track performance by topic
            const topicStats = topicPerformance.get(question.topic) || { correct: 0, total: 0 };
            topicStats.total++;
            
            if (answer.isCorrect) {
                topicStats.correct++;
                totalCorrect++;
            }
            
            topicPerformance.set(question.topic, topicStats);
        });

        // Calculate overall score as percentage
        analysis.score = Math.round((totalCorrect / answers.length) * 100);

        // Analyze topic performance
        topicPerformance.forEach((stats, topic) => {
            const performance = (stats.correct / stats.total) * 100;
            if (performance >= 70) {
                analysis.strengths.push(topic);
            } else {
                analysis.weaknesses.push(topic);
                analysis.recommendedTopics.push(topic);
            }
        });

        // Calculate overall understanding level
        analysis.understandingLevel = analysis.score;

        // Determine difficulty level for next quiz
        if (analysis.understandingLevel >= 80) {
            analysis.difficultyLevel = 'hard';
        } else if (analysis.understandingLevel <= 40) {
            analysis.difficultyLevel = 'easy';
        }

        console.log('Quiz analysis:', {
            score: analysis.score,
            understandingLevel: analysis.understandingLevel,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses
        });

        return analysis;
    }

    async _updateUserProgress(userId, subject, analysis) {
        try {
            let userProgress = await UserProgress.findOne({ user: userId });
            
            if (!userProgress) {
                userProgress = await UserProgress.create({
                    user: userId,
                    subjects: [],
                    overallGrowth: 0,
                    studyPlan: []
                });
            }

            // Find or create subject progress
            let subjectProgress = userProgress.subjects.find(s => s.subject === subject);
            if (!subjectProgress) {
                userProgress.subjects.push({
                    subject: subject,
                    overallProgress: 0,
                    topics: [],
                    quizHistory: []
                });
                subjectProgress = userProgress.subjects[userProgress.subjects.length - 1];
            }

            // Update quiz history first
            subjectProgress.quizHistory.push({
                score: analysis.score,
                date: new Date()
            });

            // Update topic progress
            const allTopics = [...new Set([...analysis.strengths, ...analysis.weaknesses])];
            allTopics.forEach(topic => {
                const isStrength = analysis.strengths.includes(topic);
                this._updateTopicProgress(subjectProgress, topic, isStrength);
            });

            // Calculate new progress
            subjectProgress.overallProgress = userProgress.calculateSubjectProgress(subject);
            userProgress.overallGrowth = userProgress.calculateOverallGrowth();
            userProgress.lastUpdated = new Date();

            // Generate/update study plan
            await this._generateStudyPlan(userProgress, subject, analysis);

            await userProgress.save();
            
            console.log('Updated user progress:', {
                subject,
                overallProgress: subjectProgress.overallProgress,
                overallGrowth: userProgress.overallGrowth,
                topicsCount: subjectProgress.topics.length,
                lastQuizScore: analysis.score
            });

            return userProgress;
        } catch (error) {
            console.error('Error updating user progress:', error);
            throw error;
        }
    }

    _updateTopicProgress(subjectProgress, topic, isStrength) {
        let topicProgress = subjectProgress.topics.find(t => t.topic === topic);
        
        if (!topicProgress) {
            topicProgress = {
                topic: topic,
                understanding: 0,
                quizzesTaken: 0,
                weakAreas: [],
                strongAreas: [],
                lastQuizDate: new Date()
            };
            subjectProgress.topics.push(topicProgress);
        }

        topicProgress.quizzesTaken++;
        topicProgress.lastQuizDate = new Date();
        
        // Update understanding score
        const changeAmount = isStrength ? 10 : -5;
        topicProgress.understanding = Math.max(0, Math.min(100, topicProgress.understanding + changeAmount));

        // Update weak/strong areas
        if (isStrength) {
            topicProgress.strongAreas = [...new Set([...topicProgress.strongAreas, topic])];
            topicProgress.weakAreas = topicProgress.weakAreas.filter(t => t !== topic);
        } else {
            topicProgress.weakAreas = [...new Set([...topicProgress.weakAreas, topic])];
            topicProgress.strongAreas = topicProgress.strongAreas.filter(t => t !== topic);
        }
    }

    _calculateSubjectProgress(subjectProgress) {
        if (!subjectProgress.topics.length) return 0;
        
        const totalUnderstanding = subjectProgress.topics.reduce(
            (sum, topic) => sum + topic.understanding, 
            0
        );
        
        // Calculate weighted progress based on quiz history
        const quizHistoryWeight = 0.3;
        const topicWeight = 0.7;
        
        const quizHistoryProgress = subjectProgress.quizHistory.length > 0 
            ? (subjectProgress.quizHistory.reduce((sum, quiz) => sum + quiz.score, 0) / subjectProgress.quizHistory.length)
            : 0;
            
        const topicProgress = totalUnderstanding / subjectProgress.topics.length;
        
        return (quizHistoryProgress * quizHistoryWeight) + (topicProgress * topicWeight);
    }

    async _generateStudyPlan(userProgress, subject, analysis) {
        // Remove old study plan items for this subject
        userProgress.studyPlan = userProgress.studyPlan.filter(item => item.subject !== subject);

        try {
            // Get relevant video content for the subject
            const Content = require('../models/Content');
            const videos = await Content.find({ subject: subject });
            
            // Generate new study plan items based on weaknesses
            const studyPlanItems = analysis.weaknesses.map(topic => {
                // Find relevant video for the topic
                const relevantVideo = videos.find(v => 
                    v.tags && v.tags.some(tag => 
                        tag.toLowerCase().includes(topic.toLowerCase())
                    )
                );

                return {
                    subject: subject,
                    topic: topic,
                    priority: analysis.understandingLevel < 50 ? 'high' : 'medium',
                    recommendedResources: [
                        {
                            type: 'video',
                            title: relevantVideo ? relevantVideo.title : `${topic} - Video Tutorial`,
                            link: relevantVideo ? relevantVideo.link : '#',
                            description: relevantVideo ? relevantVideo.description : `Watch this video to improve your understanding of ${topic}`
                        },
                        {
                            type: 'practice',
                            title: `${topic} - Practice Exercises`,
                            description: `Complete these exercises to master ${topic}`
                        }
                    ],
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
                };
            });

            userProgress.studyPlan.push(...studyPlanItems);
        } catch (error) {
            console.error('Error generating study plan:', error);
            // Still create study plan items even if video fetching fails
            const basicStudyPlanItems = analysis.weaknesses.map(topic => ({
                subject: subject,
                topic: topic,
                priority: analysis.understandingLevel < 50 ? 'high' : 'medium',
                recommendedResources: [
                    {
                        type: 'video',
                        title: `${topic} - Video Tutorial`,
                        description: `Watch this video to improve your understanding of ${topic}`
                    },
                    {
                        type: 'practice',
                        title: `${topic} - Practice Exercises`,
                        description: `Complete these exercises to master ${topic}`
                    }
                ],
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }));
            userProgress.studyPlan.push(...basicStudyPlanItems);
        }
    }
    
    // New methods for advanced quiz features
    
    async generateColdStartQuiz(subject, userId, totalQuestions = 10) {
        try {
            console.log(`🚀 Generating cold-start quiz for ${subject}`);
            const topics = [subject];
            let questions = await advancedQuizService.generateColdStartQuiz(topics, totalQuestions);

            // If generator returns fewer, pad by repeating shuffled questions
            if (questions.length < totalQuestions && questions.length > 0) {
                const needed = totalQuestions - questions.length;
                const pool = [...questions];
                while (questions.length < totalQuestions) {
                    // simple shuffle pick
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    // clone to avoid same _id collisions
                    const clone = { ...pick };
                    delete clone._id;
                    questions.push(clone);
                }
            } else if (questions.length > totalQuestions) {
                questions = questions.slice(0, totalQuestions);
            }
            
            const quiz = await Quiz.create({
                subject: subject,
                title: `${subject} Cold-Start Quiz`,
                description: `AI-generated quiz covering key concepts in ${subject}`,
                difficulty: 'adaptive',
                quizType: 'cold_start',
                generationMethod: 'ai_generated',
                questions: questions,
                ...(userId ? { user: userId } : {})
            });
            // Ensure we return the saved document with generated _id for each question
            const saved = await Quiz.findById(quiz._id).lean();
            return {
                _id: saved._id,
                questions: saved.questions,
                metadata: saved.metadata,
                quizType: 'cold_start'
            };
        } catch (error) {
            console.error('Error generating cold-start quiz:', error);
            throw error;
        }
    }
    
    async generateAdaptiveQuiz(subject, userId, totalQuestions = 12) {
        try {
            console.log(`🧠 Generating adaptive quiz for ${subject}`);
            
            const userProgress = await UserProgress.findOne({ user: userId });
            const studentPerf = this._formatStudentPerformance(userProgress, subject);
            
            // Get existing MCQ bank
            const existingQuizzes = await Quiz.find({ 
                subject: subject,
                generationMethod: 'ai_generated'
            }).limit(5);
            
            let mcqBank = [];
            existingQuizzes.forEach(q => {
                mcqBank = mcqBank.concat(q.questions);
            });
            
            if (mcqBank.length < totalQuestions) {
                // Generate/augment cold-start bank for this subject without OpenAI
                const topics = [subject];
                const needPerTopic = Math.max(totalQuestions, 20);
                const fresh = await advancedQuizService.generateColdStartQuiz(topics, needPerTopic);
                mcqBank = [...mcqBank, ...fresh];
            }
            
            const questions = await advancedQuizService.generateAdaptiveQuiz(
                mcqBank, 
                studentPerf, 
                totalQuestions, 
                [0.3, 0.5, 0.2]
            );
            
            const quiz = await Quiz.create({
                subject: subject,
                title: `${subject} Adaptive Quiz`,
                description: `Personalized quiz based on your performance in ${subject}`,
                user: userId,
                difficulty: 'adaptive',
                quizType: 'adaptive',
                generationMethod: 'ai_generated',
                questions: questions
            });
            
            // Ensure we return the saved document with generated _id for each question
            const saved = await Quiz.findById(quiz._id).lean();
            return {
                _id: saved._id,
                questions: saved.questions,
                metadata: saved.metadata,
                quizType: 'adaptive'
            };
        } catch (error) {
            console.error('Error generating adaptive quiz:', error);
            throw error;
        }
    }
    
    async generateStudyPlan(userId, hoursPerWeek = 8, blockMinutes = 40, horizonWeeks = 2) {
        try {
            console.log(`📅 Generating study plan for user ${userId}`);
            
            const userProgress = await UserProgress.findOne({ user: userId });
            if (!userProgress) {
                // Instead of throwing, return a neutral study plan generated from available topics.
                console.warn('No user progress found for user', userId, '- returning neutral study plan');
                const advancedQuizService = require('./advancedQuizService');
                const topics = advancedQuizService.getAvailableTopics();
                const perf = { topic: {} };
                topics.forEach(t => {
                    perf.topic[t] = { accuracy: 0.5, seen: 0 };
                });
                const neutralPlan = await advancedQuizService.generateStudyPlan(perf, hoursPerWeek, blockMinutes, horizonWeeks);
                return neutralPlan;
            }
            
            // Format all subjects performance
            const allSubjectPerf = {};
            userProgress.subjects.forEach(subject => {
                const topicPerf = {};
                subject.topics.forEach(topic => {
                    topicPerf[topic.topic] = {
                        accuracy: topic.understanding / 100,
                        seen: topic.quizzesTaken || 0
                    };
                });
                
                allSubjectPerf[subject.subject] = {
                    accuracy: subject.overallProgress / 100,
                    seen: subject.quizHistory?.length || 0,
                    topics: topicPerf
                };
            });
            
            const studyPlan = await advancedQuizService.generateStudyPlan(
                { topic: allSubjectPerf },
                hoursPerWeek,
                blockMinutes,
                horizonWeeks
            );
            
            // Update user progress with new study plan
            userProgress.studyPlan = studyPlan.map(item => ({
                subject: item.topic, // Map topic to subject for compatibility
                topic: item.topic,
                priority: item.priority,
                deadline: new Date(Date.now() + item.day * 24 * 60 * 60 * 1000),
                task: item.task,
                status: 'pending'
            }));
            
            await userProgress.save();
            
            return studyPlan;
        } catch (error) {
            console.error('Error generating study plan:', error);
            throw error;
        }
    }
    
    async getAvailableTopics() {
        return advancedQuizService.getAvailableTopics();
    }
    
    async getQuizAnalytics(userId, subject = null) {
        try {
            const matchQuery = { user: userId };
            if (subject) {
                matchQuery.subject = subject;
            }
            
            const analytics = await Quiz.aggregate([
                { $match: matchQuery },
                { $unwind: '$questions' },
                {
                    $group: {
                        _id: null,
                        totalQuestions: { $sum: 1 },
                        avgDifficulty: { $avg: '$metadata.averageDifficulty' },
                        difficultyDistribution: {
                            $push: '$questions.difficulty'
                        },
                        skillDistribution: {
                            $push: '$questions.skill'
                        },
                        topics: { $addToSet: '$questions.topic' },
                        subtopics: { $addToSet: '$questions.subtopic' },
                        generationMethods: { $addToSet: '$generationMethod' },
                        quizTypes: { $addToSet: '$quizType' }
                    }
                },
                {
                    $project: {
                        totalQuestions: 1,
                        avgDifficulty: { $round: ['$avgDifficulty', 2] },
                        difficultyDistribution: {
                            easy: { $size: { $filter: { input: '$difficultyDistribution', cond: { $eq: ['$$this', 'easy'] } } } },
                            medium: { $size: { $filter: { input: '$difficultyDistribution', cond: { $eq: ['$$this', 'medium'] } } } },
                            hard: { $size: { $filter: { input: '$difficultyDistribution', cond: { $eq: ['$$this', 'hard'] } } } }
                        },
                        skillDistribution: {
                            remember: { $size: { $filter: { input: '$skillDistribution', cond: { $eq: ['$$this', 'remember'] } } } },
                            understand: { $size: { $filter: { input: '$skillDistribution', cond: { $eq: ['$$this', 'understand'] } } } },
                            apply: { $size: { $filter: { input: '$skillDistribution', cond: { $eq: ['$$this', 'apply'] } } } },
                            analyze: { $size: { $filter: { input: '$skillDistribution', cond: { $eq: ['$$this', 'analyze'] } } } },
                            evaluate: { $size: { $filter: { input: '$skillDistribution', cond: { $eq: ['$$this', 'evaluate'] } } } },
                            create: { $size: { $filter: { input: '$skillDistribution', cond: { $eq: ['$$this', 'create'] } } } }
                        },
                        topics: 1,
                        subtopics: 1,
                        generationMethods: 1,
                        quizTypes: 1
                    }
                }
            ]);
            
            return analytics[0] || {
                totalQuestions: 0,
                avgDifficulty: 0,
                difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
                skillDistribution: { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0 },
                topics: [],
                subtopics: [],
                generationMethods: [],
                quizTypes: []
            };
        } catch (error) {
            console.error('Error getting quiz analytics:', error);
            throw error;
        }
    }
}

module.exports = new QuizService(); 