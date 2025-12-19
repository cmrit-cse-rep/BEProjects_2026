// diary.js – improved diary page logic

let userEmail = localStorage.getItem('email') || null;
let diaryEntries = []; // cache of entries from backend
const API_BASE = window.location.origin;

// ------------------ Helper: toast ------------------

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
  setTimeout(() => toast.classList.remove('show'), 2600);
}

// ------------------ User profile ------------------

function loadUserProfile() {
  const userData = localStorage.getItem('currentUser');
  if (!userData) {
    // No logged-in user → redirect to login/landing
    window.location.href = 'landingpage.html';
    return;
  }

  let user;
  try {
    user = JSON.parse(userData);
  } catch {
    window.location.href = 'landingpage.html';
    return;
  }

  const fullName = user.name || 'User';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Avatar in header and sidebar
  const avatarHeader = document.getElementById('user-avatar');
  const avatarSidebar = document.getElementById('user-avatar-sidebar');
  const nameSidebar = document.getElementById('sidebar-user-name');

  if (avatarHeader) avatarHeader.textContent = initials;
  if (avatarSidebar) avatarSidebar.textContent = initials;
  if (nameSidebar) nameSidebar.textContent = fullName;

  // Depression level from quizScore
  const score = user.quizScore || 0;
  let level = 'Unknown';

  if (score <= 10) level = 'No Depression';
  else if (score <= 20) level = 'Mild Depression';
  else if (score <= 35) level = 'Moderate Depression';
  else if (score <= 50) level = 'Moderately Severe Depression';
  else level = 'Severe Depression';

  const levelEl = document.getElementById('depression-level');
  if (levelEl) levelEl.textContent = level;

  // Prefer user's email for diary
  if (user.email) {
    userEmail = user.email;
    localStorage.setItem('email', user.email);
  }
}

// ------------------ Draft & counters ------------------

function updateCounters() {
  const textArea = document.getElementById('diaryText');
  const wordEl = document.getElementById('wordCount');
  const charEl = document.getElementById('charCount');
  if (!textArea || !wordEl || !charEl) return;

  const text = textArea.value || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;

  wordEl.textContent = `Words: ${words}`;
  charEl.textContent = `Characters: ${chars}`;
}

function saveDraft() {
  const textArea = document.getElementById('diaryText');
  if (!textArea || !userEmail) return;
  const key = `diaryDraft_${userEmail}`;
  localStorage.setItem(key, textArea.value);
}

function loadDraft() {
  const textArea = document.getElementById('diaryText');
  if (!textArea || !userEmail) return;
  const key = `diaryDraft_${userEmail}`;
  const draft = localStorage.getItem(key);
  if (draft) {
    textArea.value = draft;
    updateCounters();
  }
}

// ------------------ API calls ------------------

async function submitEntry() {
  const emailInput = document.getElementById('userEmail');
  const textArea = document.getElementById('diaryText');
  const reframedEl = document.getElementById('reframedOutput');
  const submitBtn = document.getElementById('btnSubmit');

  if (!emailInput || !textArea || !reframedEl) return;

  const email = emailInput.value.trim();
  const text = textArea.value.trim();

  if (!email || !text) {
    showToast('error', 'Please fill in your email and write something in your diary.');
    return;
  }

  userEmail = email;
  localStorage.setItem('email', email);

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⏳</span><span>Saving…</span>';
    }

    const res = await fetch(`${API_BASE}/api/diary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, text })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Server error: ${res.status}`);
    }

    if (data.reframed) {
      reframedEl.textContent = data.reframed;
    } else {
      reframedEl.textContent = 'Saved, but no reframed text was returned.';
    }

    // Clear draft for this user
    const draftKey = `diaryDraft_${userEmail}`;
    localStorage.removeItem(draftKey);
    textArea.value = '';
    updateCounters();

    await loadHistory(email);
    showToast('success', 'Diary entry saved successfully 💾');
  } catch (err) {
    console.error('Submit error:', err);
    showToast('error', 'Could not save your entry. Please try again.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>💾</span><span>Save Entry</span>';
    }
  }
}

async function loadHistory(email) {
  const list = document.getElementById('history');
  const emptyState = document.getElementById('historyEmpty');
  const searchInput = document.getElementById('historySearch');

  if (!list || !email) return;

  try {
    const res = await fetch(`${API_BASE}/api/diary/${encodeURIComponent(email)}`);
    const data = await res.json();

    diaryEntries = Array.isArray(data.entries) ? data.entries : [];

    if (!diaryEntries.length) {
      list.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    renderHistoryList(diaryEntries, searchInput ? searchInput.value : '');
  } catch (err) {
    console.error('History error:', err);
    list.innerHTML = '<li class="empty-state">Could not load diary history.</li>';
    if (emptyState) emptyState.style.display = 'none';
  }
}

function renderHistoryList(entries, searchTerm = '') {
  const list = document.getElementById('history');
  const emptyState = document.getElementById('historyEmpty');
  if (!list) return;

  const q = (searchTerm || '').toLowerCase();

  const filtered = entries.filter(e => {
    if (!q) return true;
    const haystack = `${e.original || ''} ${e.reframed || ''}`.toLowerCase();
    return haystack.includes(q);
  });

  if (!filtered.length) {
    list.innerHTML = '<li class="empty-state">No entries match your search.</li>';
    if (emptyState) emptyState.style.display = 'none';
    return;
  }

  const html = filtered
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(entry => {
      const date = new Date(entry.date);
      const dateLabel = date.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const preview = (entry.original || '')
        .split('\n')[0]
        .slice(0, 80)
        .trim();

      return `
        <li>
          <details>
            <summary>
              <span>${preview || 'Diary entry'}</span>
              <span class="history-date">${dateLabel}</span>
            </summary>
            <div class="history-body">
              <div><span class="label">Original:</span><br>${(entry.original || '').replace(/\n/g, '<br>')}</div>
              ${
                entry.reframed
                  ? `<div style="margin-top:0.35rem;"><span class="label">Reframed:</span><br><span class="reframed">${entry.reframed.replace(/\n/g, '<br>')}</span></div>`
                  : ''
              }
            </div>
          </details>
        </li>
      `;
    })
    .join('');

  list.innerHTML = html;
}

// ------------------ Sentiment / Reframe only ------------------

async function reframeNegativeThoughts() {
  const textArea = document.getElementById('diaryText');
  const sentimentEl = document.getElementById('sentimentAnalysis');

  if (!textArea || !sentimentEl) return;

  const text = textArea.value.trim();
  if (!text) {
    showToast('error', 'Write something in your diary first.');
    return;
  }

  try {
    sentimentEl.value = 'Analyzing your text gently…';
    const res = await fetch(`${API_BASE}/api/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Server error: ${res.status}`);
    }

    if (data.sentiment) {
      sentimentEl.value = data.sentiment;
      showToast('success', 'Sentiment analysis updated ✨');
    } else {
      sentimentEl.value = 'No sentiment text returned from server.';
    }
  } catch (err) {
    console.error('Sentiment error:', err);
    sentimentEl.value = '';
    showToast('error', 'Could not analyze your text. Please try again.');
  }
}

// ------------------ Mobile menu ------------------

function setupMobileMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (!menuToggle || !navMenu) return;

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close on nav link click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });

  // Close when clicking outside
  document.addEventListener('click', event => {
    const isInsideNav = navMenu.contains(event.target);
    const isToggle = menuToggle.contains(event.target);
    if (!isInsideNav && !isToggle && navMenu.classList.contains('active')) {
      menuToggle.classList.remove('active');
      navMenu.classList.remove('active');
    }
  });
}

// ------------------ Quick prompts ------------------

function setupPrompts() {
  const textArea = document.getElementById('diaryText');
  if (!textArea) return;

  document.querySelectorAll('.prompt-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const template = btn.dataset.template || '';
      if (!template) return;

      if (!textArea.value.trim()) {
        textArea.value = template + ' ';
      } else {
        textArea.value = textArea.value.trimEnd() + '\n\n' + template + ' ';
      }
      textArea.focus();
      updateCounters();
      saveDraft();
    });
  });
}

// ------------------ Init ------------------

function initDiary() {
  loadUserProfile();

  const emailInput = document.getElementById('userEmail');
  if (emailInput) {
    if (userEmail) emailInput.value = userEmail;
    emailInput.addEventListener('change', () => {
      userEmail = emailInput.value.trim();
      localStorage.setItem('email', userEmail);
      loadDraft();
      loadHistory(userEmail);
    });
  }

  const textArea = document.getElementById('diaryText');
  if (textArea) {
    textArea.addEventListener('input', () => {
      updateCounters();
      saveDraft();
    });
  }

  // Initial draft + counters
  if (userEmail && textArea) {
    loadDraft();
    updateCounters();
    loadHistory(userEmail);
  }

  const btnSubmit = document.getElementById('btnSubmit');
  if (btnSubmit) btnSubmit.addEventListener('click', submitEntry);

  const btnReframe = document.getElementById('btnReframe');
  if (btnReframe) btnReframe.addEventListener('click', reframeNegativeThoughts);

  const searchInput = document.getElementById('historySearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderHistoryList(diaryEntries, searchInput.value);
    });
  }

  setupMobileMenu();
  setupPrompts();
}

// DOM ready
document.addEventListener('DOMContentLoaded', initDiary);

// Expose in case you still call them inline somewhere
window.submitEntry = submitEntry;
window.loadHistory = loadHistory;
window.reframeNegativeThoughts = reframeNegativeThoughts;
