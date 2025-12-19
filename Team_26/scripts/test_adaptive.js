const quizService = require('../services/quizService');

(async () => {
  try {
    console.log('Calling quizService.generateAdaptiveQuiz for Artificial Intelligence...');
    const res = await quizService.generateAdaptiveQuiz('Artificial Intelligence', '68d42a4118e6c0924aa7a30f', 12);
    console.log('Result:', res && res.questions ? `questions=${res.questions.length}` : JSON.stringify(res));
  } catch (err) {
    console.error('Error from generateAdaptiveQuiz:');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
