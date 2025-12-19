const mongoose = require('mongoose');
const path = require('path');

// Ensure models load with project module resolution
const UserProgress = require(path.join(__dirname, '..', 'models', 'UserProgress'));
const Quiz = require(path.join(__dirname, '..', 'models', 'Quiz'));
const QuizAttempt = require(path.join(__dirname, '..', 'models', 'QuizAttempt'));

async function main() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/majorproject';
  console.log('Connecting to', mongoUri);
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

  const userId = '68d42a4118e6c0924aa7a30f';

  // Upsert a quiz doc to reference in attempts
  let quiz = await Quiz.findOne({ title: /Seed Test Quiz/i });
  if (!quiz) {
    quiz = await Quiz.create({
      subject: 'Artificial Intelligence',
      title: 'Seed Test Quiz - AI Basics',
      description: 'Seeded quiz for local dashboard testing',
      difficulty: 'easy',
      quizType: 'cold_start',
      questions: [
        { stem: 'What is AI?', options: ['A', 'B', 'C', 'D'], correctIndex: 0 }
      ]
    });
    console.log('Created quiz', quiz._id);
  } else {
    console.log('Found existing seed quiz', quiz._id);
  }

  // Upsert user progress
  const doc = {
    user: userId,
    overallGrowth: 15,
    subjects: [
      {
        subject: 'Artificial Intelligence',
        overallProgress: 55,
        topics: [
          { topic: 'Search', understanding: 60, weakAreas: [], strongAreas: [], quizzesTaken: 2, lastQuizDate: new Date() },
          { topic: 'ML Basics', understanding: 50, weakAreas: [], strongAreas: [], quizzesTaken: 1, lastQuizDate: new Date() }
        ],
        quizHistory: [
          { date: new Date(), score: 60 }
        ]
      }
    ],
    studyPlan: [
      { subject: 'Artificial Intelligence', topic: 'ML Basics', priority: 'high', deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000), recommendedResources: [ { title: 'Intro to ML', type: 'video', link: 'https://example.com', description: 'Seed resource' } ], status: 'pending' }
    ]
  };

  await UserProgress.findOneAndUpdate({ user: userId }, doc, { upsert: true, new: true });
  console.log('Upserted UserProgress for', userId);

  // Create a few quiz attempts
  await QuizAttempt.create({ user: userId, quiz: quiz._id, score: 60, total: 100, correct: 3, incorrect: 2, completedAt: new Date() });
  await QuizAttempt.create({ user: userId, quiz: quiz._id, score: 80, total: 100, correct: 4, incorrect: 1, completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000) });
  console.log('Created 2 QuizAttempt documents');

  await mongoose.disconnect();
  console.log('Done');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
