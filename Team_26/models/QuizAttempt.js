const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userAnswer: {
        type: String,
        required: true
    },
    isCorrect: {
        type: Boolean,
        required: true
    },
    timeSpent: {
        type: Number, // in seconds
        required: true
    }
});

const quizAttemptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    answers: [answerSchema],
    score: {
        type: Number,
        required: true
    },
    totalTimeSpent: {
        type: Number, // in seconds
        required: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    },
    analysis: {
        strengths: [String],
        weaknesses: [String],
        recommendedTopics: [String],
        difficultyLevel: String,
        understandingLevel: {
            type: Number, // percentage
            required: true
        }
    }
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema); 