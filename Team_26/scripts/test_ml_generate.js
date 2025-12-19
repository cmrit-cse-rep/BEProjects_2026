const advancedQuizService = require('../services/advancedQuizService');

(async () => {
  try {
    console.log('Starting ML cold-start generation test for Artificial Intelligence...');
    const questions = await advancedQuizService.generateColdStartQuiz(['Artificial Intelligence'], 12);
    console.log('Generated questions count:', questions.length);
    console.dir(questions.slice(0, 5), { depth: 3 });
  } catch (err) {
    console.error('Test failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
