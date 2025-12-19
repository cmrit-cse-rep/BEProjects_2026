// Articles Implementation - displays mental health articles from a local dataset with external links
// Features: search, category filter, sort, modal details, bookmarks

const STORAGE_KEY = 'mindfulai_bookmarks_v1';

// Complete articles dataset with internal content and external resource links
const articlesData = [
  {
    id: 1,
    title: "Mindfulness for Beginners: A Practical Guide",
    source: 'Mindful.org',
    category: 'Mindfulness',
    excerpt: 'Simple, evidence-based practices to get started with mindfulness, including breath work and short daily routines you can do anywhere.',
    url: 'https://www.mindful.org/how-to-meditate/',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop',
    date: '2023-09-12'
  },
  {
    id: 2,
    title: 'Mental Health Support in India: Resources & Helplines',
    source: 'NIMHANS & NGOs',
    category: 'India Resources',
    excerpt: 'A curated list of hotlines, government programs, and NGO services offering mental health support across Indian states and major cities.',
    url: 'https://nimhans.ac.in',
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=2070',
    date: '2024-01-05'
  },
  {
    id: 3,
    title: 'CBT Techniques: Short Exercises for Anxiety',
    source: 'Psychology Today',
    category: 'Anxiety',
    excerpt: 'Practical Cognitive Behavioural Therapy (CBT) exercises to challenge anxious thoughts and build mental resilience.',
    url: 'https://www.verywellmind.com/cognitive-behavior-therapy-2795542',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070',
    date: '2022-11-20'
  },
  {
    id: 4,
    title: 'Meditation Apps: Best Picks for 2024',
    source: 'Tech Wellness',
    category: 'Tools',
    excerpt: 'Comparison of popular meditation apps, their strengths and pricing to help you pick the right one for consistent practice.',
    url: 'https://www.forbes.com/health/wellness/best-meditation-apps/',
    image: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&h=400&fit=crop',
    date: '2024-03-02'
  },
  {
    id: 5,
    title: 'Nutrition and Mental Health: Foods That Help',
    source: 'Nutrition Today',
    category: 'Wellness',
    excerpt: 'An overview of nutrients, diet patterns, and simple recipes that support mood and cognitive function.',
    url: 'https://www.health.harvard.edu/blog/nutritional-psychiatry-your-brain-on-food-201511168626',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=400&fit=crop',
    date: '2023-06-18'
  },
  {
    id: 6,
    title: 'Mental Health: Strengthening Our Response',
    source: 'World Health Organization',
    category: 'Global Health',
    excerpt: 'WHO overview on global mental health priorities, strategies for integration of mental health into health systems, and resources for support.',
    url: 'https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=400&fit=crop',
    date: '2021-10-10'
  },
  {
    id: 7,
    title: 'Mental Health Information and Research',
    source: 'National Institute of Mental Health (NIMH)',
    category: 'Research',
    excerpt: 'Authoritative information about mental disorders, treatments, and cutting-edge research from the U.S. National Institute of Mental Health.',
    url: 'https://www.nimh.nih.gov/health/topics',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070',
    date: '2023-08-01'
  },
  {
    id: 8,
    title: 'Mental Health Services and Support',
    source: 'NHS (UK)',
    category: 'Wellbeing',
    excerpt: 'Practical advice and guides on managing common mental health problems, improving wellbeing, and finding local support in the UK.',
    url: 'https://www.nhs.uk/nhs-services/mental-health-services/',
    image: 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?q=80&w=2070',
    date: '2024-02-14'
  },
  {
    id: 9,
    title: 'Mental Health: Overview and Tips',
    source: 'Mayo Clinic',
    category: 'Health',
    excerpt: 'Trusted, clinician-reviewed articles on mental health conditions, symptoms, and treatments with practical tips for self-care.',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/mental-health/art-20044098',
    image: 'https://images.unsplash.com/photo-1527236438218-d82077ae1f85?q=80&w=2070',
    date: '2022-05-20'
  },
  {
    id: 10,
    title: 'How to Look After Your Mental Health',
    source: 'Mental Health Foundation',
    category: 'Wellbeing',
    excerpt: 'Guides and evidence-based tips on looking after your mental health, from everyday wellbeing to understanding mental illnesses.',
    url: 'https://www.mentalhealth.org.uk/explore-mental-health/articles/how-look-after-your-mental-health',
    image: 'https://images.unsplash.com/photo-1527236438218-d82077ae1f85?q=80&w=2070',
    date: '2023-11-11'
  }
];

// Utility functions
function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, m => map[m]);
}

function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveBookmarks(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function isBookmarked(id) {
  return loadBookmarks().includes(id);
}

function toggleBookmark(id) {
  const list = loadBookmarks();
  const idx = list.indexOf(id);
  if (idx === -1) {
    list.push(id);
  } else {
    list.splice(idx, 1);
  }
  saveBookmarks(list);
}

function truncate(text, n = 140) {
  if (!text) return '';
  return text.length > n ? text.slice(0, n - 1) + '…' : text;
}

// Get filtered and sorted articles
function getFilteredList() {
  const searchInput = qs('#searchInput');
  const categoryFilter = qs('#categoryFilter');
  const sortSelect = qs('#sortSelect');

  const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const cat = categoryFilter ? categoryFilter.value : 'all';
  const sort = sortSelect ? sortSelect.value : 'newest';

  let list = articlesData.slice();

  // Filter by category
  if (cat !== 'all') {
    list = list.filter(a => a.category === cat);
  }

  // Filter by search
  if (q) {
    list = list.filter(a => {
      const haystack = (a.title + ' ' + a.excerpt + ' ' + a.category).toLowerCase();
      return haystack.includes(q);
    });
  }

  // Sort
  if (sort === 'newest') {
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sort === 'oldest') {
    list.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sort === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  return list;
}

// Render articles to grid
function renderArticles(list) {
  const grid = qs('#articlesGrid');
  const noArticles = qs('#noArticles');

  if (!grid) return;

  grid.innerHTML = '';

  if (list.length === 0) {
    if (noArticles) noArticles.style.display = 'block';
    return;
  }

  if (noArticles) noArticles.style.display = 'none';

  list.forEach(article => {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.setAttribute('data-id', article.id);

    card.innerHTML = `
      <img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.title)}" class="article-image">
      <div class="article-content">
        <span class="article-category">${escapeHtml(article.category)}</span>
        <h3 class="article-title">${escapeHtml(article.title)}</h3>
        <p class="article-excerpt">${escapeHtml(truncate(article.excerpt, 160))}</p>
        <div class="article-meta">
          <span>${escapeHtml(article.source)}</span>
          <button class="read-btn" data-id="${article.id}">Read More</button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  // Attach event listeners
  qsa('.read-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const id = parseInt(e.currentTarget.dataset.id);
      const article = articlesData.find(a => a.id === id);
      if (article) showModal(article);
    });
  });
}

// Populate category filter dropdown
function renderCategories() {
  const select = qs('#categoryFilter');
  if (!select) return;

  const cats = Array.from(new Set(articlesData.map(a => a.category))).sort();
  select.innerHTML = '<option value="all">All Categories</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

// Show modal with article details
function showModal(article) {
  const modal = qs('#articleModal');
  if (!modal) return;

  const title = qs('#modalTitle');
  const image = qs('#modalImage');
  const source = qs('#modalSource');
  const summary = qs('#modalSummary');
  const readBtn = qs('#modalRead');

  if (title) title.textContent = article.title;
  if (image) {
    image.src = article.image;
    image.alt = article.title;
  }
  if (source) source.textContent = `${article.source} • ${article.date}`;
  if (summary) summary.textContent = article.excerpt + '\n\nSource: ' + article.source + '\n\nFor full article, click "Open Source" button above.';

  if (readBtn) {
    readBtn.textContent = 'Open Source';
    readBtn.onclick = () => window.open(article.url, '_blank');
  }

  modal.classList.add('active');
  
}

// Close modal
function closeModal() {
  const modal = qs('#articleModal');
  if (!modal) return;
  modal.classList.remove('active');
  
}

// Apply current filters and re-render
function renderCurrent() {
  const list = getFilteredList();
  renderArticles(list);
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Set year
  const yearSpan = qs('#year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // Setup event listeners
  const searchInput = qs('#searchInput');
  const categoryFilter = qs('#categoryFilter');
  const sortSelect = qs('#sortSelect');
  const clearFilters = qs('#clearFilters');
  const modalClose = qs('#modalClose');
  const modal = qs('#articleModal');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderCurrent();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', renderCurrent);
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', renderCurrent);
  }

  if (clearFilters) {
    clearFilters.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (categoryFilter) categoryFilter.value = 'all';
      if (sortSelect) sortSelect.value = 'newest';
      renderCurrent();
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Initial render
  renderCategories();
  renderCurrent();
});

// Expose for debugging
window.MindfulArticles = {
  data: articlesData,
  bookmarks: loadBookmarks,
  toggleBookmark
};
