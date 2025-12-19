// scripts/seedQuizzesFromSubjects.js
// For each subject in Content, generate several quizzes (using AdvancedQuizService) and upsert into Quiz collection.
// Usage: node scripts/seedQuizzesFromSubjects.js --perSubject 3 --questionsPerQuiz 12

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const argv = require('process').argv.slice(2);

dotenv.config();

async function main() {
  const MONGO = process.env.MONGO_URI;
  if (!MONGO) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  // parse args
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--perSubject') args.perSubject = parseInt(argv[++i], 10);
    else if (argv[i] === '--questionsPerQuiz') args.questionsPerQuiz = parseInt(argv[++i], 10);
  }
  const perSubject = args.perSubject || 3;
  const questionsPerQuiz = args.questionsPerQuiz || 12;

  await mongoose.connect(MONGO, {});
  const Content = require('../models/Content');
  const Quiz = require('../models/Quiz');
  const advService = require('../services/advancedQuizService');

  const contents = await Content.find({}).lean();
  if (!contents || contents.length === 0) {
    console.log('No Content documents found. Seed content first.');
    await mongoose.disconnect();
    return;
  }

  for (const c of contents) {
    const subject = c.subject || c.title || 'General';
    console.log(`Generating quizzes for subject: ${subject}`);
    for (let i = 0; i < perSubject; i++) {
      try {
        // call advancedQuizService to generate adaptive quiz using the subject as performance/topic
        const studentPerf = { topic: { [subject]: { accuracy: 0.5 } } };
        const questions = await advService.generateAdaptiveQuiz([], studentPerf, questionsPerQuiz);

        // Normalize structure to match Quiz model questionSchema
        const qDocs = questions.map(q => ({
          question: q.question || q.stem || q.text || '',
          options: q.options || [],
          correctAnswer: q.correctAnswer || (q.options && q.options[q.correctIndex]) || (q.options && q.options[0]) || '',
          difficulty: q.difficulty || 'medium',
          topic: q.topic || subject,
          subtopic: q.subtopic || '',
          skill: q.skill || 'understand',
          source: q.source || 'generated',
          metadata: q.metadata || { qualityScore: q.confidence || 0.5 }
        }));

        const title = `Seeded ${subject} Quiz ${i+1}`;
        const quizDoc = new Quiz({
          subject,
          title,
          description: `Auto-generated quiz for ${subject}`,
          questions: qDocs,
          difficulty: 'adaptive',
          quizType: 'practice',
          generationMethod: 'ai_generated'
        });

        await quizDoc.save();
        console.log(`Saved quiz for ${subject}: ${title} (questions: ${qDocs.length})`);
      } catch (e) {
        console.error(`Failed to generate/save quiz for ${subject} (iteration ${i}):`, e && e.message ? e.message : e);
      }
    }
  }

  await mongoose.disconnect();
  console.log('Seeding quizzes complete');
}

main().catch(err => { console.error('Seeder failed:', err); process.exit(1); });
