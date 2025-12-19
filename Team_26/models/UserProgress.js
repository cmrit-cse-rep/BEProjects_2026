const mongoose = require('mongoose');

const topicProgressSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: true
    },
    understanding: {
        type: Number, // percentage
        required: true,
        default: 0
    },
    quizzesTaken: {
        type: Number,
        default: 0
    },
    lastQuizDate: Date,
    weakAreas: [String],
    strongAreas: [String]
});

const subjectProgressSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    overallProgress: {
        type: Number, // percentage
        default: 0
    },
    topics: [topicProgressSchema],
    quizHistory: [{
        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz'
        },
        score: Number,
        date: {
            type: Date,
            default: Date.now
        }
    }]
});

const studyPlanSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    topic: String,
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    },
    recommendedResources: [{
        type: {
            type: String,
            enum: ['video', 'article', 'practice', 'quiz'],
            required: true
        },
        title: String,
        link: String,
        description: String
    }],
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },
    deadline: Date
});

const userProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subjects: [subjectProgressSchema],
    overallGrowth: {
        type: Number, // percentage
        default: 0
    },
    studyPlan: [studyPlanSchema],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Method to calculate overall growth
userProgressSchema.methods.calculateOverallGrowth = function() {
    if (!this.subjects.length) return 0;
    
    const totalProgress = this.subjects.reduce((sum, subject) => {
        // Ensure we're using a valid number for progress
        const progress = subject.overallProgress || 0;
        return sum + progress;
    }, 0);
    
    return Math.round(totalProgress / this.subjects.length);
};

// Add method to calculate subject progress
userProgressSchema.methods.calculateSubjectProgress = function(subject) {
    const subjectProgress = this.subjects.find(s => s.subject === subject);
    if (!subjectProgress || !subjectProgress.topics.length) return 0;
    
    // Calculate topic understanding average
    const topicProgress = subjectProgress.topics.reduce((sum, topic) => {
        return sum + (topic.understanding || 0);
    }, 0) / subjectProgress.topics.length;
    
    // Calculate quiz history average
    const quizProgress = subjectProgress.quizHistory.length > 0
        ? subjectProgress.quizHistory.reduce((sum, quiz) => sum + quiz.score, 0) / 
          subjectProgress.quizHistory.length
        : 0;
    
    // Weighted average (70% topics, 30% quizzes)
    const weightedProgress = (topicProgress * 0.7) + (quizProgress * 0.3);
    
    return Math.round(weightedProgress);
};

// Add pre-save middleware to update progress
userProgressSchema.pre('save', function(next) {
    // Update each subject's progress
    this.subjects.forEach(subject => {
        subject.overallProgress = this.calculateSubjectProgress(subject.subject);
    });
    
    // Update overall growth
    this.overallGrowth = this.calculateOverallGrowth();
    
    next();
});

module.exports = mongoose.model('UserProgress', userProgressSchema); 