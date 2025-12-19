// mood.js – interactive mood tracker
// Uses API:
//   POST /api/mood           { email, mood: { value, label, emoji, notes, date } }
//   GET  /api/mood-history/:email  => { moodEntries: [...] }

let selectedMood = null;
let userEmail = null;
let moodHistory = [];
let moodChart = null;

// Infer backend base URL (works for localhost:3000 and deployed)
const API_BASE = window.location.origin;

// --------------- Helpers ----------------

function getCurrentUser() {
  const userData = localStorage.getItem('currentUser');
  if (!userData) return null;
  try {
    const user = JSON.parse(userData);
    userEmail = user.email;
    return user;
  } catch {
    return null;
  }
}

function showToast(type, message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const msgEl = toast.querySelector('.toast-message');
  const iconEl = toast.querySelector('.toast-icon');

  toast.classList.remove('toast--error', 'toast--success');
  if (type === 'error') {
    toast.classList.add('toast--error');
    if (iconEl) iconEl.textContent = '⚠️';
  } else {
    toast.classList.add('toast--success');
    if (iconEl) iconEl.textContent = '✅';
  }
  if (msgEl) msgEl.textContent = message;

  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function getHistoryFilterValue() {
  const select = document.getElementById('historyFilter');
  return select ? select.value : '7';
}

// Return filtered mood history according to selected days
function getFilteredHistory(days) {
  if (!moodHistory.length) return [];

  if (days === 'all') return [...moodHistory];

  const n = parseInt(days, 10);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - n);

  return moodHistory.filter(entry => new Date(entry.date) >= cutoff);
}

// --------------- API Calls ----------------

async function loadMoodHistory() {
  if (!userEmail) return [];

  try {
    const res = await fetch(`${API_BASE}/api/mood-history/${encodeURIComponent(userEmail)}`);
    if (!res.ok) {
      console.error('Failed to load mood history:', res.status);
      return [];
    }
    const data = await res.json();
    moodHistory = data.moodEntries || [];
    return moodHistory;
  } catch (err) {
    console.error('Error loading mood history:', err);
    return [];
  }
}

async function submitMood() {
  if (!selectedMood || !userEmail) return;

  const notesInput = document.getElementById('moodNotes');
  const slider = document.getElementById('moodSlider');
  const submitBtn = document.getElementById('submitMood');

  const value = slider ? parseInt(slider.value, 10) : selectedMood.value || 5;
  const notes = notesInput ? notesInput.value.trim() : '';

  const moodPayload = {
    email: userEmail,
    mood: {
      value,
      label: selectedMood.label,
      emoji: selectedMood.emoji,
      notes,
      date: new Date().toISOString()
    }
  };

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="icon">⏳</span><span>Saving…</span>`;
    }

    const res = await fetch(`${API_BASE}/api/mood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moodPayload)
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    showToast('success', 'Mood logged successfully 🎉');
    resetForm();
    await refreshMoodUI(); // reload stats, chart, history
  } catch (err) {
    console.error('Error submitting mood:', err);
    showToast('error', 'Failed to save mood. Please try again.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span class="icon">💾</span><span>Save today’s mood</span>`;
    }
  }
}

// --------------- UI Update Functions ----------------

function resetForm() {
  document.querySelectorAll('.mood-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  selectedMood = null;

  const notesInput = document.getElementById('moodNotes');
  if (notesInput) notesInput.value = '';

  const slider = document.getElementById('moodSlider');
  const sliderValue = document.getElementById('moodSliderValue');
  if (slider) slider.value = 6;
  if (sliderValue) sliderValue.textContent = '6';

  document
    .querySelectorAll('.tag-pill')
    .forEach(tag => tag.classList.remove('active'));

  const submitBtn = document.getElementById('submitMood');
  if (submitBtn) submitBtn.disabled = true;
}

function displayMoodHistory(days) {
  const container = document.getElementById('moodHistory');
  if (!container) return;

  const list = getFilteredHistory(days);
  if (!list.length) {
    container.innerHTML = `<div class="no-data">No mood entries for this period. Start logging to see your trends 💙</div>`;
    return;
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  const html = list
    .map(entry => {
      const date = new Date(entry.date);
      const dateLabel = date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });

      return `
        <div class="mood-entry">
          <div class="entry-date">${dateLabel}</div>
          <div class="entry-mood">${entry.emoji || '🙂'}</div>
          <div class="entry-details">
            <div class="entry-label">${entry.label || 'Mood'}</div>
            ${
              entry.notes
                ? `<div class="entry-notes">“${entry.notes.replace(/"/g, '&quot;')}”</div>`
                : ''
            }
          </div>
        </div>
      `;
    })
    .join('');

  container.innerHTML = html;
}

function updateStats() {
  const avgEl = document.getElementById('avgMood');
  const totalEl = document.getElementById('totalEntries');
  const streakEl = document.getElementById('streakDays');

  if (!moodHistory.length) {
    if (avgEl) avgEl.textContent = '-';
    if (totalEl) totalEl.textContent = '0';
    if (streakEl) streakEl.textContent = '0';
    return;
  }

  const total = moodHistory.length;
  const sum = moodHistory.reduce((acc, entry) => acc + (entry.value || 0), 0);
  const avg = (sum / total).toFixed(1);

  if (avgEl) avgEl.textContent = avg;
  if (totalEl) totalEl.textContent = total.toString();
  if (streakEl) streakEl.textContent = calculateStreak().toString();
}

function calculateStreak() {
  if (!moodHistory.length) return 0;

  // Work with unique days (one per calendar day)
  const daysSet = new Set(
    moodHistory.map(entry =>
      new Date(entry.date).toISOString().split('T')[0]
    )
  );
  const days = Array.from(daysSet).sort(); // ascending YYYY-MM-DD

  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  // Walk backwards from today and see how many consecutive days exist
  // in the set of recorded days.
  while (true) {
    const key = current.toISOString().split('T')[0];
    if (daysSet.has(key)) {
      streak += 1;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function renderChart(days) {
  const ctx = document.getElementById('moodChart');
  if (!ctx) return;

  const dataList = getFilteredHistory(days);
  if (!dataList.length) {
    if (moodChart) {
      moodChart.destroy();
      moodChart = null;
    }
    return;
  }

  const sorted = [...dataList].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const labels = sorted.map(entry =>
    new Date(entry.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    })
  );
  const values = sorted.map(entry => entry.value || 0);

  if (moodChart) {
    moodChart.destroy();
  }

  moodChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Mood score',
          data: values,
          tension: 0.35,
          borderWidth: 2,
          borderColor: '#189ab4',
          backgroundColor: 'rgba(24, 154, 180, 0.20)',
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: {
            stepSize: 2
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const value = ctx.parsed.y;
              return `Mood: ${value}/10`;
            }
          }
        }
      }
    }
  });
}

async function refreshMoodUI() {
  await loadMoodHistory();
  const filter = getHistoryFilterValue();
  updateStats();
  displayMoodHistory(filter);
  renderChart(filter);
}

// --------------- Event Listeners ----------------

function setupEventListeners() {
  // Mood options
  document.querySelectorAll('.mood-option').forEach(option => {
    option.addEventListener('click', () => {
      document
        .querySelectorAll('.mood-option')
        .forEach(opt => opt.classList.remove('selected'));

      option.classList.add('selected');

      const emojiEl = option.querySelector('.mood-emoji');
      selectedMood = {
        label: option.dataset.label,
        emoji: emojiEl ? emojiEl.textContent : '🙂'
      };

      // Sync slider with default value attached to option
      const defaultValue = parseInt(option.dataset.mood, 10) || 6;
      const slider = document.getElementById('moodSlider');
      const sliderValue = document.getElementById('moodSliderValue');
      if (slider) slider.value = defaultValue;
      if (sliderValue) sliderValue.textContent = String(defaultValue);

      const submitBtn = document.getElementById('submitMood');
      if (submitBtn) submitBtn.disabled = false;
    });
  });

  // Slider
  const slider = document.getElementById('moodSlider');
  if (slider) {
    const sliderValue = document.getElementById('moodSliderValue');
    slider.addEventListener('input', () => {
      if (sliderValue) sliderValue.textContent = slider.value;
    });
  }

  // Quick tags (append to notes)
  document.querySelectorAll('.tag-pill').forEach(tag => {
    tag.addEventListener('click', () => {
      tag.classList.toggle('active');
      const notesInput = document.getElementById('moodNotes');
      if (!notesInput) return;

      const tagText = `#${tag.dataset.tag}`;
      const current = notesInput.value || '';

      if (tag.classList.contains('active')) {
        // Add tag if not present
        if (!current.includes(tagText)) {
          notesInput.value = current.length
            ? `${current} ${tagText}`
            : tagText;
        }
      } else {
        // Remove tag
        notesInput.value = current.replace(tagText, '').replace(/\s{2,}/g, ' ').trim();
      }
    });
  });

  // Submit button
  const submitBtn = document.getElementById('submitMood');
  if (submitBtn) {
    submitBtn.addEventListener('click', submitMood);
  }

  // Filter change
  const filterSelect = document.getElementById('historyFilter');
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      const days = filterSelect.value;
      displayMoodHistory(days);
      renderChart(days);
    });
  }
}

// --------------- Init ----------------

function initMoodPage() {
  const user = getCurrentUser();
  if (!user || !user.email) {
    alert('You are not logged in. Redirecting to login...');
    window.location.href = '/login.html'; // adjust if your login is different
    return;
  }

  setupEventListeners();
  refreshMoodUI();
}

document.addEventListener('DOMContentLoaded', initMoodPage);
