const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    topic: {
        type: String,
        required: true
    },
    subtopic: {
        type: String,
        default: ''
    },
    skill: {
        type: String,
        enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
        default: 'understand'
    },
    source: {
        type: String,
        default: 'generated'
    },
    metadata: {
        generatedAt: {
            type: Date,
            default: Date.now
        },
        qualityScore: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.5
        },
        attempts: {
            type: Number,
            default: 0
        },
        correctAttempts: {
            type: Number,
            default: 0
        }
    }
});

const quizSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    questions: [questionSchema],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'adaptive'],
        default: 'medium'
    },
    quizType: {
        type: String,
        enum: ['cold_start', 'adaptive', 'practice', 'assessment'],
        default: 'practice'
    },
    generationMethod: {
        type: String,
        enum: ['manual', 'ai_generated', 'hybrid'],
        default: 'ai_generated'
    },
    metadata: {
        totalQuestions: {
            type: Number,
            default: 0
        },
        topics: [String],
        subtopics: [String],
        difficultyDistribution: {
            easy: { type: Number, default: 0 },
            medium: { type: Number, default: 0 },
            hard: { type: Number, default: 0 }
        },
        skillDistribution: {
            remember: { type: Number, default: 0 },
            understand: { type: Number, default: 0 },
            apply: { type: Number, default: 0 },
            analyze: { type: Number, default: 0 },
            evaluate: { type: Number, default: 0 },
            create: { type: Number, default: 0 }
        },
        averageDifficulty: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.5
        },
        estimatedTimeMinutes: {
            type: Number,
            default: 15
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
quizSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Calculate metadata if questions are present
    if (this.questions && this.questions.length > 0) {
        this.metadata.totalQuestions = this.questions.length;
        
        // Extract unique topics and subtopics
        this.metadata.topics = [...new Set(this.questions.map(q => q.topic))];
        this.metadata.subtopics = [...new Set(this.questions.map(q => q.subtopic).filter(s => s))];
        
        // Calculate difficulty distribution
        const difficultyCounts = this.questions.reduce((acc, q) => {
            acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
            return acc;
        }, {});
        this.metadata.difficultyDistribution = {
            easy: difficultyCounts.easy || 0,
            medium: difficultyCounts.medium || 0,
            hard: difficultyCounts.hard || 0
        };
        
        // Calculate skill distribution
        const skillCounts = this.questions.reduce((acc, q) => {
            acc[q.skill] = (acc[q.skill] || 0) + 1;
            return acc;
        }, {});
        this.metadata.skillDistribution = {
            remember: skillCounts.remember || 0,
            understand: skillCounts.understand || 0,
            apply: skillCounts.apply || 0,
            analyze: skillCounts.analyze || 0,
            evaluate: skillCounts.evaluate || 0,
            create: skillCounts.create || 0
        };
        
        // Calculate average difficulty
        const difficultyValues = { easy: 0.33, medium: 0.66, hard: 1.0 };
        const totalDifficulty = this.questions.reduce((sum, q) => sum + difficultyValues[q.difficulty], 0);
        this.metadata.averageDifficulty = totalDifficulty / this.questions.length;
        
        // Estimate time (2 minutes per question on average)
        this.metadata.estimatedTimeMinutes = Math.ceil(this.questions.length * 2);
    }
    
    next();
});

// Index for better query performance
quizSchema.index({ subject: 1, user: 1 });
quizSchema.index({ createdAt: -1 });
quizSchema.index({ 'metadata.topics': 1 });

module.exports = mongoose.model('Quiz', quizSchema); 