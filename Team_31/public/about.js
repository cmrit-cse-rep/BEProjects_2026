// Public copy re-exports logic by loading original about.js when served statically
document.addEventListener('DOMContentLoaded', () => {
  const s = document.createElement('script');
  s.src = '../about.js';
  document.head.appendChild(s);
});

