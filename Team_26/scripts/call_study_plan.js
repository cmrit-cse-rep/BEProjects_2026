const fetch = globalThis.fetch || require('node-fetch');

(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/quiz/study-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hoursPerWeek: 8, blockMinutes: 40, horizonWeeks: 2 }),
      redirect: 'manual'
    });
    console.log('status', res.status, res.statusText);
    const text = await res.text();
    console.log('body:', text.slice(0, 1000));
  } catch (e) {
    console.error('request error', e);
  }
})();
