const axios = require('axios');

async function run() {
  try {
    // 1) Generate cold-start quiz with 10 questions
    const gen = await axios.get('http://localhost:5000/api/quiz/cold-start/Artificial%20Intelligence', {
      params: { totalQuestions: 10 }
    });
    const quiz = gen.data.quiz;
    console.log('Generated quiz id:', quiz._id, 'questions:', quiz.questions.length);

    // 2) Build random answers
    const answers = quiz.questions.map((q) => ({
      questionId: q._id,
      userAnswer: q.options[0],
      isCorrect: q.options[0] === q.correctAnswer,
      timeSpent: 5
    }));

    // 3) Submit
    const submit = await axios.post('http://localhost:5000/api/quiz/submit', {
      quizId: quiz._id,
      answers
    }, {
      // include cookie if your API requires auth; this route uses isLoggedIn in routes
      validateStatus: () => true
    });

    console.log('Submit status:', submit.status);
    console.log('Submit body keys:', Object.keys(submit.data));
    if (submit.data.error) {
      console.error('Error:', submit.data.error);
    } else {
      console.log('Attempt score:', submit.data.attempt?.score);
    }
  } catch (e) {
    console.error('Test failed:', e.response?.data || e.message);
    process.exit(1);
  }
}

run();


