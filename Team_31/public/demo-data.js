// demo-data.js
// Populate localStorage with demo user, mood entries and tasks if missing
// Only run demo seeding when explicitly requested (query ?demo=true) OR on localhost
(function(){
  const isDemoMode = (typeof window !== 'undefined') && (window.location && (window.location.search.includes('demo=true') || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
  if (!isDemoMode) return; // Do not auto-insert demo data in production
  try {
    if (!localStorage.getItem('currentUser')) {
      const demoUser = { name: 'Demo User', email: 'demo@local', quizScore: 12 };
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
      console.log('[demo-data] currentUser set');
    }

    if (!localStorage.getItem('moodEntries')) {
      const days = 7;
      const entries = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0,0,0,0);
        const iso = d.toISOString();
        // generate a mood value between 4 and 8
        const value = Math.floor(4 + Math.random()*5);
        entries.push({ date: iso, value, label: ['Terrible','Poor','Okay','Good','Great','Excellent'][Math.max(0, Math.min(5, value-1))] });
      }
      localStorage.setItem('moodEntries', JSON.stringify(entries));
      console.log('[demo-data] moodEntries set', entries);
    }

    if (!localStorage.getItem('todoTasks_v1')) {
      const today = new Date();
      const iso = today.toISOString().split('T')[0];
      const tasks = [
        { id: 't1', text: 'Walk for 10 minutes', date: iso, completed: true },
        { id: 't2', text: 'Write 3 things you are grateful for', date: iso, completed: false },
        { id: 't3', text: '5-minute breathing', date: iso, completed: true }
      ];
      localStorage.setItem('todoTasks_v1', JSON.stringify(tasks));
      console.log('[demo-data] todoTasks_v1 set', tasks);
    }

    if (!localStorage.getItem('latestReport')) {
      const report = {
        timestamp: new Date().toISOString(),
        quizScore: 12,
        level: 'Mild',
        summary: 'Demo: Mild symptoms',
        riskLevel: 'Low',
        recommendations: ['Start your day with a 5-minute meditation']
      };
      localStorage.setItem('latestReport', JSON.stringify(report));
      console.log('[demo-data] latestReport set');
    }

    if (!localStorage.getItem('userXP')) {
      // seed demo XP so dashboard shows level/progress
      const demoXP = { total: 45 };
      localStorage.setItem('userXP', JSON.stringify(demoXP));
      console.log('[demo-data] userXP set', demoXP);
    }
  } catch (e) {
    console.error('[demo-data] error:', e);
  }
})();
