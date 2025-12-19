/**
 * Dashboard Enhanced Module
 * Handles: Charts, Task Persistence, Onboarding, Gamification, Smart Recommendations
 */

// Chart.js CDN will be loaded in HTML; this module uses window.Chart

const DashboardEnhanced = {
  user: null,
  moodChart: null,
  progressChart: null,
  streakData: { xp: 0, streak: 0 },
  tasksData: [],

  // Initialize the enhanced dashboard
  async init() {
    console.log('[Dashboard] Initializing enhanced dashboard...');

    // Load user from localStorage
    this.user = JSON.parse(localStorage.getItem('currentUser'));
    if (!this.user) {
      console.warn('[Dashboard] No user found, redirecting...');
      window.location.href = 'landingpage.html';
      return;
    }

    // Initialize components
    await this.initializeGamification();
    await this.loadMoodHistory();
    await this.loadTasksData();
    await this.initializeCharts();
    // Listen for XP updates from other modules/tabs
    try {
      // Custom event used when scripts update localStorage directly
      window.addEventListener('userXPUpdated', (e) => {
        try {
          const total = e?.detail?.total ?? this.getUserXP();
          this.setUserXP(Number(total));
        } catch (err) { console.warn('[Gamification] userXPUpdated handler error', err); }
      });

      // Listen to storage events (from other tabs) so XP display updates across windows
      window.addEventListener('storage', (e) => {
        if (!e) return;
        if (e.key === 'userXP') {
          try {
            this.streakData.xp = this.getUserXP();
            this.updateXPDisplay();
            if (this.progressChart) {
              try {
                this.progressChart.data.datasets[0].data[1] = this.streakData.xp;
                this.progressChart.update();
              } catch (err) {}
            }
          } catch (err) { console.warn('[Gamification] storage event handler error', err); }
        }
      });
    } catch (e) { console.warn('[Gamification] failed to attach XP listeners', e); }

    this.showOnboarding();
    this.loadSmartRecommendations();
    this.wireTaskUI();

    console.log('[Dashboard] Enhanced dashboard initialized');
  },

  // ============ GAMIFICATION ============
  async initializeGamification() {
    console.log('[Gamification] Initializing XP and streak...');
    // Load local XP first
    const localXP = this.getUserXP();
    this.streakData.xp = localXP || 0;
    this.streakData.streak = this.streakData.streak || 0;

    // Try to sync with server - fall back to localStorage if unavailable
    try {
      const res = await fetch(`/api/tasks/${this.user.email}`);
      if (res.ok) {
        const data = await res.json();
        // prefer server but don't overwrite local XP unless server provides a value
        if (data && typeof data.xp === 'number') this.streakData.xp = data.xp;
        if (data && typeof data.streak === 'number') this.streakData.streak = data.streak;
      }
    } catch (err) {
      console.warn('[Gamification] Server gamification unavailable, using local XP');
    }

    // Update header with XP/Streak
    this.updateXPDisplay();
    // Pulse XP visually
    if (typeof this.pulseXP === 'function') this.pulseXP();

    // Check and award badges
    this.checkBadges();
  },

  // User XP helpers (persisted in localStorage under 'userXP')
  getUserXP() {
    try {
      const raw = localStorage.getItem('userXP');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return Number(parsed.total) || 0;
    } catch (e) {
      console.error('[Gamification] getUserXP error', e);
      return 0;
    }
  },

  setUserXP(total) {
    try {
      const payload = { total: Number(total) };
      localStorage.setItem('userXP', JSON.stringify(payload));
      this.streakData.xp = Number(total);
      // notify dashboard UI
      this.updateXPDisplay();
      // update progress chart if exists
      if (this.progressChart) {
        try {
          this.progressChart.data.datasets[0].data[1] = this.streakData.xp;
          this.progressChart.update();
        } catch (e) {}
      }
    } catch (e) {
      console.error('[Gamification] setUserXP error', e);
    }
  },

  addXP(amount, reason) {
    try {
      const current = this.getUserXP();
      const next = Number(current) + Number(amount || 0);
      this.setUserXP(next);
      // Visual cue + small toast
      this.pulseXP();
      this.showXPToast(amount, reason);
    } catch (e) {
      console.error('[Gamification] addXP error', e);
    }
  },

  calculateLevel(totalXP) {
    // Simple level calc: level 1 starts at 0, each level requires +100 XP.
    const xp = Number(totalXP) || 0;
    const level = Math.floor(xp / 100) + 1;
    const xpThisLevel = xp - (level - 1) * 100;
    const xpForNext = 100;
    const pct = Math.min(100, Math.floor((xpThisLevel / xpForNext) * 100));
    return { level, xpThisLevel, xpForNext, pct };
  },

  updateXPDisplay() {
    const xpEl = document.getElementById('user-xp');
    const streakEl = document.getElementById('user-streak');
    if (xpEl) xpEl.textContent = `${this.streakData.xp} XP`;
    if (streakEl) streakEl.textContent = `${this.streakData.streak} 🔥`;

    // Update XP progress bar (if present)
    const xpProgressFill = document.getElementById('xp-progress-fill');
    const xpProgressText = document.getElementById('xp-progress-text');
    if (xpProgressFill && xpProgressText) {
      const lvl = this.calculateLevel(this.streakData.xp);
      xpProgressFill.style.width = `${lvl.pct}%`;
      xpProgressText.textContent = `Level ${lvl.level} — ${lvl.xpThisLevel}/${lvl.xpForNext} XP`;
    }
  },

  showXPToast(amount, reason) {
    try {
      const toast = document.createElement('div');
      toast.className = 'xp-toast';
      toast.style.position = 'fixed';
      toast.style.right = '18px';
      toast.style.bottom = '18px';
      toast.style.background = 'linear-gradient(90deg, #189ab4, #75e6da)';
      toast.style.color = 'white';
      toast.style.padding = '10px 14px';
      toast.style.borderRadius = '10px';
      toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      toast.style.zIndex = 2000;
      toast.textContent = `+${amount} XP` + (reason ? ` — ${reason}` : '');
      document.body.appendChild(toast);
      setTimeout(() => { toast.style.opacity = '0'; toast.remove(); }, 2500);
    } catch (e) { }
  },

  pulseXP() {
    const xpEl = document.getElementById('user-xp');
    if (!xpEl) return;
    xpEl.classList.add('xp-pulse');
    setTimeout(() => xpEl.classList.remove('xp-pulse'), 800);
  },

  checkBadges() {
    const badges = [];
    if (this.streakData.streak >= 5) badges.push({ name: 'Week Warrior', icon: '⚔️' });
    if (this.streakData.xp >= 100) badges.push({ name: 'Century', icon: '🎯' });
    if (this.streakData.xp >= 250) badges.push({ name: 'Master', icon: '👑' });

    const badgesEl = document.getElementById('user-badges');
    if (badgesEl && badges.length > 0) {
      badgesEl.innerHTML = badges.map(b => `<span class="badge" title="${b.name}">${b.icon}</span>`).join('');
      badgesEl.style.display = 'inline-flex';
    }
  },

  // ============ CHARTS ============
  async loadMoodHistory() {
    console.log('[Charts] Loading mood history...');

    try {
      const res = await fetch(`/api/mood-history/${this.user.email}`);
      const data = await res.json();
      return data.moodEntries || [];
    } catch (err) {
      console.error('[Charts] Error loading mood history:', err);
      // Fallback to localStorage keys used by mood page
      try {
        const stored = localStorage.getItem('moodEntries') || localStorage.getItem('mood_history') || localStorage.getItem('moodHistory');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Normalize possible shapes into array of { date: ISO, value: number }
          const normalized = (Array.isArray(parsed) ? parsed : parsed.entries || [])
            .map(e => {
              // Accept several key names
              const date = e.date || e.timestamp || e.createdAt || e.ts || null;
              const value = (e.value != null) ? e.value : (e.mood != null ? e.mood : (e.level != null ? e.level : null));
              // If timestamp is numeric, convert
              let iso = null;
              if (typeof date === 'number') iso = new Date(date).toISOString();
              else if (typeof date === 'string') {
                // if it's already ISO-like or yyyy-mm-dd, keep it
                iso = date.includes('T') ? date : (date.length === 10 ? date + 'T00:00:00.000Z' : date);
              }
              return { date: iso || new Date().toISOString(), value: Number(value) || null };
            });
          return normalized;
        }
      } catch (e) {
        console.error('[Charts] Error reading mood from localStorage:', e);
      }
      return [];
    }
  },

  async loadTasksData() {
    console.log('[Charts] Loading tasks data...');

    try {
      const res = await fetch(`/api/tasks/${this.user.email}`);
      const data = await res.json();
      this.tasksData = data.groupedTasks || data.tasksByDate || data || {};
      return this.tasksData;
    } catch (err) {
      console.error('[Charts] Error loading tasks:', err);
      // Fallback to localStorage (todoTasks_v1) used by tasks.js
      try {
        const stored = localStorage.getItem('todoTasks_v1') || localStorage.getItem('todos');
        if (stored) {
          const tasks = JSON.parse(stored);
          // group by date
          const grouped = {};
          (Array.isArray(tasks) ? tasks : Object.values(tasks)).forEach(t => {
            const date = t.date || (t.due || new Date().toISOString().split('T')[0]);
            const key = date.toString().split('T')[0];
            grouped[key] = grouped[key] || [];
            grouped[key].push(t);
          });
          this.tasksData = grouped;
          return this.tasksData;
        }
      } catch (e) {
        console.error('[Charts] Error reading tasks from localStorage:', e);
      }
      return {};
    }
  },

  async initializeCharts() {
    console.log('[Charts] Initializing Chart.js charts...');

    if (typeof Chart === 'undefined') {
      console.warn('[Charts] Chart.js not loaded, skipping charts');
      return;
    }

    // Mood trend chart (last 7 days)
    await this.initMoodTrendChart();

    // Progress chart (XP, tasks, streak)
    this.initProgressChart();
  },

  async initMoodTrendChart() {
    const canvas = document.getElementById('moodTrendChart');
    if (!canvas) {
      console.warn('[Charts] Mood trend canvas not found');
      return;
    }

    const moodHistory = await this.loadMoodHistory();
    const last7Days = this.getLast7Days(moodHistory);

    let labels = last7Days.map(d => d.date);
    let data = last7Days.map(d => d.mood);

    // If there is no usable mood data, provide a hardcoded demo series so the chart is visible
    const noMoodData = data.length === 0 || data.every(v => v === null || v === undefined || Number.isNaN(v));
    if (noMoodData) {
      const demoValues = [4, 6, 5, 3, 7, 8, 6];
      // generate labels for last 7 days
      const demoLabels = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        demoLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
      labels = demoLabels;
      data = demoValues;
      console.log('[Charts] No mood data found — using demo values for Mood Trend chart');
    }

    this.moodChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Mood Level',
            data,
            borderColor: '#189ab4',
            backgroundColor: 'rgba(24, 154, 180, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: '#189ab4',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            callbacks: {
              label: (ctx) => `Mood: ${ctx.parsed.y}/10`,
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 10,
            ticks: { stepSize: 2 },
            title: { display: true, text: 'Mood Level' },
          },
          x: {
            title: { display: true, text: 'Date' },
          },
        },
      },
    });

    console.log('[Charts] Mood trend chart initialized');
  },

  initProgressChart() {
    const canvas = document.getElementById('progressChart');
    if (!canvas) {
      console.warn('[Charts] Progress canvas not found');
      return;
    }

    const daysWithTasks = Object.keys(this.tasksData).length;
    const totalXP = this.streakData.xp;
    const streak = this.streakData.streak;
    // If tasks data is empty, provide demo values so the doughnut is visible
    const demoProgress = (daysWithTasks === 0 && totalXP === 0 && streak === 0);
    const progressData = demoProgress ? [30, 60, 5] : [daysWithTasks * 10, totalXP, streak * 5];

    this.progressChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Tasks Completed', 'XP Earned', 'Streak Days'],
        datasets: [
          {
            data: progressData,
            backgroundColor: ['#75e6da', '#189ab4', '#05445e'],
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true, position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.parsed}`,
            },
          },
        },
      },
    });

    console.log('[Charts] Progress chart initialized');
  },

  getLast7Days(moodEntries) {
    const result = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const entry = moodEntries.find(m => m.date.startsWith(dateStr));
      const mood = entry ? entry.value : null;

      result.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood,
      });
    }

    return result;
  },

  // ============ TASK PERSISTENCE ============
  wireTaskUI() {
    console.log('[Tasks] Wiring task UI to backend...');

    const taskList = document.getElementById('task-list');
    const taskCheckboxes = taskList ? taskList.querySelectorAll('.task-checkbox') : [];

    taskCheckboxes.forEach((checkbox, idx) => {
      checkbox.addEventListener('click', () => {
        const taskItem = checkbox.closest('.task-item');
        const taskText = taskItem.querySelector('.task-text')?.textContent || `Task ${idx + 1}`;
        const isCompleted = checkbox.classList.contains('completed');

        this.saveTask(taskText, !isCompleted);
      });
    });

    // Wire "Add Task" button
    const addTaskBtn = document.querySelector('.task-add-btn');
    const taskNameInput = document.getElementById('custom-task-name');
    const taskTimeInput = document.getElementById('custom-task-time');

    if (addTaskBtn) {
      addTaskBtn.addEventListener('click', async () => {
        const taskName = taskNameInput.value.trim();
        const taskTime = taskTimeInput.value || 'Anytime';

        if (!taskName) {
          alert('Please enter a task name');
          return;
        }

        await this.addTask(taskName, taskTime);
        taskNameInput.value = '';
        taskTimeInput.value = '';
      });
    }
  },

  async addTask(taskName, taskTime) {
    console.log('[Tasks] Adding task:', taskName);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.user.email,
          task: taskName,
          time: taskTime,
          date: new Date().toISOString().split('T')[0],
          completed: false,
        }),
      });

      if (res.ok) {
        console.log('[Tasks] Task added successfully');
        // Reload tasks and update UI
        await this.loadTasksData();
        this.initializeGamification();
        alert('Task added! Great job 🎉');
      } else {
        alert('Failed to add task');
      }
    } catch (err) {
      console.error('[Tasks] Error adding task:', err);
      alert('Error saving task');
    }
  },

  async saveTask(taskName, completed) {
    console.log('[Tasks] Saving task:', taskName, 'completed:', completed);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.user.email,
          task: taskName,
          time: 'Tracked',
          date: new Date().toISOString().split('T')[0],
          completed,
        }),
      });

      if (res.ok) {
        console.log('[Tasks] Task saved successfully');
        // Re-fetch gamification data
        await this.initializeGamification();
      }
    } catch (err) {
      console.error('[Tasks] Error saving task:', err);
    }
  },

  // ============ ONBOARDING ============
  showOnboarding() {
    console.log('[Onboarding] Checking if onboarding needed...');

    const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${this.user.email}`);
    if (hasSeenOnboarding) {
      console.log('[Onboarding] User has seen onboarding, skipping');
      return;
    }

    console.log('[Onboarding] Showing first-time tour...');
    this.launchIntroTour();
    localStorage.setItem(`onboarding_seen_${this.user.email}`, 'true');
  },

  launchIntroTour() {
    const steps = [
      {
        element: '.greeting',
        title: '👋 Welcome to Your Dashboard!',
        description: 'This is your personalized mental health dashboard. Track your mood, complete tasks, and practice mindfulness.',
      },
      {
        element: '.charts-section',
        title: '📊 View Your Progress',
        description: 'See your mood trends and progress at a glance. Charts update as you log data and complete tasks.',
      },
      {
        element: '.dashboard-card:nth-child(1)',
        title: '📈 Your Progress Card',
        description: 'Monitor your treatment plan progress. Complete activities to reach your goals.',
      },
      {
        element: '.dashboard-card:nth-child(3)',
        title: '✅ Daily Tasks',
        description: 'Create and complete daily tasks. Each completed task earns you XP and builds your streak!',
      },
      {
        element: '.dashboard-card:nth-child(4)',
        title: '🌬️ Mindful Breathing',
        description: 'Take a moment to breathe. Guided breathing exercises help reduce anxiety and improve focus.',
      },
    ];

    let currentStep = 0;
    let currentTooltip = null;
    let overlay = null;

    const createOverlay = () => {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'onboarding-overlay';
        overlay.addEventListener('click', () => closeTourHandler());
        document.body.appendChild(overlay);
      }
      return overlay;
    };

    const showStep = () => {
      // Remove previous tooltip
      if (currentTooltip) {
        currentTooltip.remove();
        currentTooltip = null;
      }

      // Remove previous highlight
      document.querySelectorAll('.onboarding-highlight').forEach(el => {
        el.classList.remove('onboarding-highlight');
      });

      // Check if tour is complete
      if (currentStep >= steps.length) {
        closeTourHandler();
        return;
      }

      const step = steps[currentStep];
      const element = document.querySelector(step.element);

      if (!element) {
        currentStep++;
        showStep();
        return;
      }

      // Create overlay
      createOverlay();

      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Highlight element
      element.classList.add('onboarding-highlight');

      // Create tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'onboarding-tooltip';
      tooltip.innerHTML = `
        <div class="tooltip-header">${step.title}</div>
        <div class="tooltip-body">${step.description}</div>
        <div class="tooltip-footer">
          ${currentStep > 0 ? '<button class="tooltip-btn" id="prevBtn">← Back</button>' : '<button class="tooltip-btn" style="visibility:hidden;"></button>'}
          <span class="tooltip-progress">${currentStep + 1}/${steps.length}</span>
          <button class="tooltip-btn" id="nextBtn">${currentStep < steps.length - 1 ? 'Next →' : 'Finish ✓'}</button>
        </div>
      `;

      document.body.appendChild(tooltip);
      currentTooltip = tooltip;

      // Position tooltip near element
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top = rect.bottom + 20;
        let left = rect.left + (rect.width - tooltipRect.width) / 2;

        // Adjust for viewport boundaries
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
          left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top + tooltipRect.height > window.innerHeight) {
          top = rect.top - tooltipRect.height - 20;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
      }, 50);

      // Attach button listeners
      const nextBtn = tooltip.querySelector('#nextBtn');
      const prevBtn = tooltip.querySelector('#prevBtn');

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          currentStep++;
          showStep();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          currentStep = Math.max(0, currentStep - 1);
          showStep();
        });
      }
    };

    const closeTourHandler = () => {
      if (currentTooltip) currentTooltip.remove();
      if (overlay) overlay.remove();
      document.querySelectorAll('.onboarding-highlight').forEach(el => {
        el.classList.remove('onboarding-highlight');
      });
      currentTooltip = null;
      overlay = null;
    };

    // Expose methods globally
    window.DashboardEnhanced.nextTourStep = () => {
      currentStep++;
      showStep();
    };

    window.DashboardEnhanced.prevTourStep = () => {
      currentStep = Math.max(0, currentStep - 1);
      showStep();
    };

    window.DashboardEnhanced.closeTour = closeTourHandler;

    showStep();
  },

  // ============ SMART RECOMMENDATIONS ============
  loadSmartRecommendations() {
    console.log('[Recommendations] Loading smart recommendations...');

    // Load user's quiz report
    const report = JSON.parse(localStorage.getItem('latestReport'));
    if (!report) {
      console.warn('[Recommendations] No report found');
      return;
    }

    const level = report.level || 'Mild';
    const recommendations = this.getRecommendations(level);

    // Display recommendations in a card or modal
    const recEl = document.getElementById('smart-recommendations');
    if (recEl) {
      const rec = recommendations[0]; // Show 1 recommended action
      recEl.innerHTML = `
        <div style="padding: 1rem; background: linear-gradient(135deg, #189ab4, #75e6da); border-radius: 8px; color: white;">
          <h4 style="margin-top: 0;">Today's Recommendation</h4>
          <p>${rec}</p>
          <button onclick="window.location.href='resources.html'" style="background: white; color: #05445e; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: 600;">
            Learn More →
          </button>
        </div>
      `;
    }
  },

  getRecommendations(level) {
    const recommendations = {
      'No Depression': [
        'Keep up your healthy habits! Practice a 10-minute mindfulness session.',
        'Maintain social connections by scheduling a call with a friend.',
        'Try a new hobby or activity you enjoy.',
      ],
      'Mild Depression': [
        'Start your day with a 5-minute meditation using our Mindful Breathing tool.',
        'Take a 15-minute walk outside to boost your mood.',
        'Write down 3 things you\'re grateful for today.',
      ],
      'Moderate Depression': [
        'Consider scheduling a session with a mental health professional.',
        'Use CBT techniques: identify and challenge one negative thought today.',
        'Join a support group or connect with others who understand.',
      ],
      'Moderately Severe Depression': [
        'Reach out to a mental health professional if you haven\'t already.',
        'Focus on small wins: complete one task today, no matter how small.',
        'Practice self-compassion: treat yourself as you would a good friend.',
      ],
      'Severe Depression': [
        'Please seek immediate professional help. Crisis hotlines are available 24/7.',
        'Reach out to a trusted friend or family member today.',
        'Focus on safety and basic self-care: eat, sleep, and stay hydrated.',
      ],
    };

    return recommendations[level] || recommendations['Mild Depression'];
  },
};

// Initialize on document ready
document.addEventListener('DOMContentLoaded', () => {
  // Expose globally so other scripts (tasks.js) can trigger updates
  window.DashboardEnhanced = DashboardEnhanced;
  DashboardEnhanced.init();
});
