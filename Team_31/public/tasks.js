/*
  Client-side Todo Manager
  - Fully client-side with localStorage persistence under key 'todoTasks'
  - Features: add, edit, delete, toggle complete, filters, clear all
  - Gracefully attempts server sync if /api/tasks endpoints are available (best-effort)
*/

const TODO_KEY = 'todoTasks_v1';

function generateId() {
  return 't_' + Math.random().toString(36).slice(2, 9);
}

function readTasks() {
  try {
    const raw = localStorage.getItem(TODO_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read tasks', e);
    return [];
  }
}

function writeTasks(tasks) {
  localStorage.setItem(TODO_KEY, JSON.stringify(tasks));
}

function formatTime(t) {
  return t ? t : 'Anytime';
}

function renderTasks(filter = 'all') {
  const list = document.getElementById('todo-list');
  if (!list) return;
  const tasks = readTasks();

  const filtered = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
  });

  list.innerHTML = '';
  if (filtered.length === 0) {
    list.innerHTML = '<li class="todo-empty">No tasks yet. Add one above ✨</li>';
    return;
  }

  for (const t of filtered) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (t.completed ? ' completed' : '');
    li.dataset.id = t.id;

    li.innerHTML = `
      <div class="check" title="Toggle complete">${t.completed ? '✓' : ''}</div>
      <div class="content">
        <div class="title">${escapeHtml(t.text)}</div>
        <div class="meta">${formatTime(t.time)}</div>
      </div>
      <div class="todo-actions">
        <button class="icon-btn edit" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="icon-btn delete" title="Delete"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;

    // toggle complete
    li.querySelector('.check').addEventListener('click', () => {
      toggleComplete(t.id);
    });

    // delete
    li.querySelector('.delete').addEventListener('click', () => {
      if (confirm('Delete this task?')) deleteTask(t.id);
    });

    // edit
    li.querySelector('.edit').addEventListener('click', () => {
      startEditTask(t.id);
    });

    list.appendChild(li);
  }
}

function addTask(text, time) {
  if (!text || !text.trim()) return;
  const tasks = readTasks();
  const newTask = { id: generateId(), text: text.trim(), time: time || '', completed: false, createdAt: Date.now() };
  tasks.unshift(newTask);
  writeTasks(tasks);
  renderTasks(getActiveFilter());
}

function toggleComplete(id) {
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return;
  tasks[idx].completed = !tasks[idx].completed;
  writeTasks(tasks);
  renderTasks(getActiveFilter());
  // Award XP when a task is completed
  try {
    if (tasks[idx].completed) {
      // default XP per task completion
      const xpAward = 10;
      if (window.DashboardEnhanced && typeof window.DashboardEnhanced.addXP === 'function') {
        window.DashboardEnhanced.addXP(xpAward, 'Completed Task');
      } else {
        // fallback: persist locally
        try {
          const raw = localStorage.getItem('userXP');
          const cur = raw ? (JSON.parse(raw).total || 0) : 0;
            const next = cur + xpAward;
            localStorage.setItem('userXP', JSON.stringify({ total: next }));
            // Notify any listeners in this window (and other windows via storage event)
            try {
              window.dispatchEvent(new CustomEvent('userXPUpdated', { detail: { total: next } }));
            } catch (e) {}
        } catch (e) {}
      }
    }
  } catch (e) { console.error('Error awarding XP', e); }
}

function deleteTask(id) {
  let tasks = readTasks();
  tasks = tasks.filter(t => t.id !== id);
  writeTasks(tasks);
  renderTasks(getActiveFilter());
}

function startEditTask(id) {
  const tasks = readTasks();
  const t = tasks.find(x => x.id === id);
  if (!t) return;

  // Populate inputs for editing
  const nameInput = document.getElementById('custom-task-name');
  const timeInput = document.getElementById('custom-task-time');
  const addBtn = document.getElementById('add-task-btn');

  nameInput.value = t.text;
  timeInput.value = t.time || '';
  nameInput.focus();

  // Switch add button to save
  addBtn.textContent = 'Save';
  addBtn.dataset.editing = id;
}

function saveEdit(id, newText, newTime) {
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return;
  tasks[idx].text = newText.trim();
  tasks[idx].time = newTime || '';
  writeTasks(tasks);
  renderTasks(getActiveFilter());
}

function clearAllTasks() {
  if (!confirm('Clear all saved tasks?')) return;
  localStorage.removeItem(TODO_KEY);
  renderTasks(getActiveFilter());
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getActiveFilter() {
  const el = document.querySelector('.todo-filter.active');
  return el ? el.id.replace('filter-', '') : 'all';
}

function bindUi() {
  const addBtn = document.getElementById('add-task-btn');
  const nameInput = document.getElementById('custom-task-name');
  const timeInput = document.getElementById('custom-task-time');
  const clearBtn = document.getElementById('clear-tasks');

  addBtn.addEventListener('click', () => {
    const editingId = addBtn.dataset.editing;
    const text = nameInput.value.trim();
    const time = timeInput.value;
    if (!text) return alert('Please enter a task name');

    if (editingId) {
      saveEdit(editingId, text, time);
      addBtn.textContent = 'Add';
      delete addBtn.dataset.editing;
    } else {
      addTask(text, time);
    }

    nameInput.value = '';
    timeInput.value = '';
    nameInput.focus();
  });

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBtn.click();
  });

  clearBtn.addEventListener('click', () => clearAllTasks());

  // filters
  document.getElementById('filter-all').addEventListener('click', () => setFilter('all'));
  document.getElementById('filter-active').addEventListener('click', () => setFilter('active'));
  document.getElementById('filter-completed').addEventListener('click', () => setFilter('completed'));
}

function setFilter(name) {
  document.querySelectorAll('.todo-filter').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('filter-' + name);
  if (el) el.classList.add('active');
  renderTasks(name);
}

document.addEventListener('DOMContentLoaded', () => {
  // initialize UI bindings and render
  bindUi();
  renderTasks('all');

  // set today's date in dashboard (if missing)
  const todayEl = document.getElementById('todayDate');
  if (todayEl) {
    const opts = { year: 'numeric', month: 'long', day: 'numeric' };
    todayEl.textContent = new Date().toLocaleDateString(undefined, opts);
  }
});