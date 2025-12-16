// Data
const fraudTypes = [
  {
    name: "Ponzi Schemes",
    risk: "HIGH",
    color: "red",
    description: "A fraudulent investment operation where earlier investors are paid returns using funds from new investors rather than from actual profits.",
    examples: ["Bernie Madoff scheme ($65 billion)", "OneCoin scheme ($billions)"],
    loss_estimate: "Billions annually",
    indicators: ["Guaranteed high returns", "Pressure to recruit new investors", "Vague investment strategies"],
    detection_methods: ["Unsustainable return patterns", "New investor funding analysis"]
  },
  {
    name: "Pump-and-Dump Schemes",
    risk: "HIGH",
    color: "red",
    description: "Artificial inflation of stock prices through false information, followed by offloading shares to unsuspecting investors.",
    examples: ["Ahmedabad scam (4,000 investors)", "Shell company revival schemes"],
    loss_estimate: "$1-3 billion annually in microcap fraud alone",
    indicators: ["Coordinated messaging campaigns", "Sudden price spikes", "High volume without fundamentals", "False social media hype"],
    detection_methods: ["Order book analysis", "Social media sentiment analysis", "Volume-price correlation"]
  },
  {
    name: "Insider Trading",
    risk: "HIGH",
    color: "red",
    description: "Trading securities based on material non-public information (UPSI) before public disclosure.",
    examples: ["Infosys case (₹3.06 crore gains)", "Future Retail case (₹17.78 crore)", "IEX case (₹173 crore)", "WhatsApp leak case"],
    loss_estimate: "Millions in illegal gains",
    indicators: ["Trading before announcements", "Unusual volume spikes", "Coordinated trading patterns", "UPSI sharing via messaging"],
    detection_methods: ["Cross-checking transaction timing", "Communication monitoring", "Trading pattern analysis"],
    legal_penalty: "Market ban, fines, imprisonment"
  },
  {
    name: "Spoofing",
    risk: "MEDIUM",
    color: "orange",
    description: "Placing and immediately canceling large orders to create fake price movement impressions.",
    examples: ["High-frequency trading manipulation", "Order book distortion"],
    loss_estimate: "Market distortion, difficult to quantify individual losses",
    indicators: ["High order cancellation rates", "Repetitive ping-pong patterns", "Orders immediately canceled after placement"],
    detection_methods: ["Order placement-to-cancellation ratio analysis", "ML-based pattern recognition", "Anomaly detection systems"]
  },
  {
    name: "Microcap Fraud",
    risk: "HIGH",
    color: "red",
    description: "Falsely promoting low-priced stocks (usually under $5) and selling them to unsuspecting public.",
    examples: ["Shell company schemes", "Internet-based pump-and-dumps"],
    loss_estimate: "$1-3 billion annually",
    indicators: ["Aggressive online promotion", "Vague business operations", "Unverifiable claims"],
    detection_methods: ["Regulatory screening", "Business verification", "Social media monitoring"]
  },
  {
    name: "Phishing & Social Engineering",
    risk: "MEDIUM",
    color: "orange",
    description: "Scammers impersonate trusted entities to trick victims into revealing sensitive data.",
    examples: ["Fake investment platforms", "Fraudulent trading app clones"],
    loss_estimate: "₹222 crores (investment scheme scams)",
    indicators: ["Suspicious emails", "Fake websites", "Urgent requests for information", "Unknown contacts"],
    detection_methods: ["Email authentication", "URL verification", "User education", "Multi-factor authentication"]
  },
  {
    name: "Algorithmic Fraud",
    risk: "MEDIUM",
    color: "orange",
    description: "AI-based trading software that promises guaranteed profits but deceives investors.",
    examples: ["Fake algorithmic software", "Clone trading apps"],
    loss_estimate: "Millions lost annually",
    indicators: ["Guaranteed returns promises", "Unverifiable algorithms", "Pressure for upfront fees"],
    detection_methods: ["Algorithm verification", "Performance claim audits", "Platform legitimacy checks"]
  },
  {
    name: "Money Laundering",
    risk: "HIGH",
    color: "red",
    description: "Disguising illegally obtained funds to appear legitimate through layering techniques.",
    examples: ["Cryptocurrency conversion", "Offshore account schemes"],
    loss_estimate: "Billions globally",
    indicators: ["Unusual fund flows", "Shell company involvement", "Suspicious wire patterns"],
    detection_methods: ["Transaction pattern analysis", "Company verification", "Cross-border monitoring"]
  }
];

const recentCases = [
  {
    date: "2025-11-16",
    location: "Delhi",
    fraud_type: "Stock Market Investment Fraud",
    amount_lost: "3.38 lakh",
    victims: 1,
    status: "Arrested (2), Bound down (1)",
    details: "Woman cheated of Rs 3.38 lakh through fake stock investment scheme with mule accounts"
  },
  {
    date: "2025-11-16",
    location: "Mangaluru",
    fraud_type: "WhatsApp Stock Market Scam",
    amount_lost: "2.7 crore",
    victims: 1,
    status: "Under Investigation",
    details: "Man lost Rs 2.7 crore through fake 'F1 HDFC Securities' WhatsApp group with false investment tips"
  },
  {
    date: "2025-11-04",
    location: "Hyderabad",
    fraud_type: "IPO Block Trading Fraud",
    amount_lost: "1 crore+",
    victims: 2,
    status: "Under Investigation",
    details: "Employees lost over Rs 1 crore each in fake IPO block trading on fraudulent portals"
  },
  {
    date: "2025-10-15",
    location: "National (IEX Trading)",
    fraud_type: "Insider Trading",
    amount_lost: "173 crore",
    victims: "Multiple",
    status: "Enforcement Action",
    details: "SEBI froze Rs 173.14 crore from 8 entities in IEX insider trading case involving CERC policy leak"
  },
  {
    date: "2025-07-22",
    location: "Mumbai",
    fraud_type: "Cyber Fraud - Stock Investment",
    amount_lost: "7.88 crore",
    victims: 1,
    status: "Case Filed",
    details: "62-year-old woman duped of Rs 7.88 crore by cyber fraudsters promising high returns"
  },
  {
    date: "2024-09-04",
    location: "Assam",
    fraud_type: "Online Trading Scam",
    amount_lost: "22000 crore",
    victims: "Thousands",
    status: "Busted",
    details: "Massive scam involving fraudulent brokers claiming to double investors' money"
  },
  {
    date: "2024-03-17",
    location: "Navi Mumbai",
    fraud_type: "Share Trading Fraud",
    amount_lost: "1.36 crore",
    victims: 1,
    status: "Case Filed",
    details: "Man lost Rs 1.36 crore to cyber fraudsters in share trading scheme"
  },
  {
    date: "2025-06-30",
    location: "Ahmedabad",
    fraud_type: "Pump-and-Dump (Shell Companies)",
    amount_lost: "Unknown (significant)",
    victims: 4000,
    status: "Under Investigation",
    details: "SEBI investigating stock manipulation using revived defunct companies to defraud 4,000 retail investors"
  }
];

const fraudNews = [
  {
    headline: "SEBI Takes Action Against 886 Entities for Unfair Trading",
    date: "2025-08-19",
    source: "SEBI",
    category: "Regulatory Action",
    severity: "HIGH",
    excerpt: "SEBI enforcement action against 886 entities between April 2024-June 2025 for fraudulent and unfair trade practices under PFUTP Regulations, 2003"
  },
  {
    headline: "Woman Duped of Rs 7.88 Crore in Stock Investment Fraud",
    date: "2025-07-22",
    source: "NDTV",
    category: "Cyber Fraud",
    severity: "HIGH",
    excerpt: "Mumbai woman cheated by cyber fraudsters posing as investment brokers, promising high returns. Money traced through multiple channels."
  },
  {
    headline: "Delhi Woman Cheated of Rs 3.38 Lakh in Stock Market Fraud",
    date: "2025-11-16",
    source: "ThePrint",
    category: "Investment Fraud",
    severity: "MEDIUM",
    excerpt: "Delhi Police arrests two cybercriminals operating over 50 mule accounts for fake investment schemes. Stolen funds diverted to cryptocurrency."
  },
  {
    headline: "Mangaluru Man Loses Rs 2.7 Crore in WhatsApp Stock Scam",
    date: "2025-11-16",
    source: "Deccan Herald",
    category: "Social Engineering",
    severity: "HIGH",
    excerpt: "Investor trapped by fake 'F1 HDFC Securities' WhatsApp group sharing false stock tips. Fraudsters demanded additional payments to release profits."
  },
  {
    headline: "SEBI Bars 8 Entities in Rs 173 Crore IEX Insider Trading Case",
    date: "2025-10-15",
    source: "Moneycontrol",
    category: "Insider Trading",
    severity: "CRITICAL",
    excerpt: "Largest insider trading crackdown involving CERC official leak. Shares information via WhatsApp. SEBI froze Rs 173.14 crore in alleged gains."
  },
  {
    headline: "Ahmedabad Stock Manipulation Scam Under SEBI Investigation",
    date: "2025-06-30",
    source: "Economic Times",
    category: "Market Manipulation",
    severity: "HIGH",
    excerpt: "4,000 investors misled through pump-and-dump operation using shell companies and revived defunct firms. Investigation ongoing for 3-6 months."
  },
  {
    headline: "Insider Trading Cases Jump 2x in FY24",
    date: "2025-11-16",
    source: "Moneycontrol",
    category: "Regulatory Trends",
    severity: "MEDIUM",
    excerpt: "Insider trading investigations jumped from 85 in FY23 to 175 in FY24. Front-running probes jumped 3x from 24 to 83."
  },
  {
    headline: "Rs 22,000 Crore Assam Trading Scam Busted",
    date: "2024-09-04",
    source: "NDTV",
    category: "Market Manipulation",
    severity: "CRITICAL",
    excerpt: "Assam Police uncovered massive online trading scam worth Rs 22,000 crore involving fraudulent brokers claiming to double investors' money."
  }
];

const detectionMethods = [
  {
    name: "Random Forest",
    category: "Machine Learning",
    accuracy: "99.96%",
    description: "Ensemble learning method combining multiple decision trees for robust fraud detection"
  },
  {
    name: "XGBoost",
    category: "Machine Learning",
    accuracy: "High",
    description: "Sequential tree training improving upon previous models for maximum fraud detection accuracy"
  },
  {
    name: "LSTM Neural Networks",
    category: "Deep Learning",
    accuracy: "High",
    description: "Recurrent neural networks capturing temporal patterns in trading behavior"
  },
  {
    name: "Isolation Forest",
    category: "Anomaly Detection",
    accuracy: "Effective",
    description: "Isolates anomalies in the feature space without distance calculations"
  },
  {
    name: "Order Book Analysis",
    category: "Real-time Detection",
    accuracy: "Effective",
    description: "Monitors placement-to-cancellation ratios to detect spoofing patterns"
  },
  {
    name: "Sentiment Analysis",
    category: "NLP/Social Media",
    accuracy: "Effective",
    description: "Analyzes social media for coordinated hype and manipulation signals"
  },
  {
    name: "Behavioral Anomaly Detection",
    category: "Real-time Detection",
    accuracy: "Effective",
    description: "Identifies unusual trading patterns deviating from historical norms"
  },
  {
    name: "Network Analysis",
    category: "Relationship Analysis",
    accuracy: "Effective",
    description: "Detects coordinated activity and connections between suspicious accounts"
  }
];

// Alert system data (stored in memory)
let alertsData = [
  {
    id: 1,
    stock: "INFY",
    keyword: "insider trading",
    type: "Regulatory Action",
    frequency: "Real-time",
    status: "Active",
    created: "15-11-2025"
  },
  {
    id: 2,
    stock: "FRL",
    keyword: "market manipulation",
    type: "News Mention",
    frequency: "Daily",
    status: "Active",
    created: "10-11-2025"
  }
];

let nextAlertId = 3;

// Navigation
function navigateTo(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Remove active class from all nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected page
  document.getElementById(pageId).classList.add('active');
  
  // Add active class to clicked button
  document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
}

// Initialize dashboard
function initDashboard() {
  // Fraud summary
  const fraudSummary = document.getElementById('fraud-summary');
  const topFrauds = fraudTypes.filter(f => f.risk === 'HIGH').slice(0, 4);
  
  fraudSummary.innerHTML = topFrauds.map(fraud => `
    <div class="fraud-summary-item">
      <div class="fraud-summary-info">
        <h4>${fraud.name}</h4>
        <p>${fraud.loss_estimate}</p>
      </div>
      <div class="risk-badge ${fraud.risk.toLowerCase()}">${fraud.risk}</div>
    </div>
  `).join('');
  
  // Recent alerts
  const recentAlerts = document.getElementById('recent-alerts');
  const topCases = recentCases.slice(0, 3);
  
  recentAlerts.innerHTML = topCases.map(caseItem => `
    <div class="alert-item">
      <div class="alert-date">${formatDate(caseItem.date)}</div>
      <div class="alert-title">${caseItem.location} - ${caseItem.fraud_type}</div>
      <div class="alert-amount">₹${caseItem.amount_lost}</div>
    </div>
  `).join('');
}

// Initialize fraud types page
function initFraudTypes() {
  const grid = document.getElementById('fraud-types-grid');
  
  function renderFraudTypes(types) {
    grid.innerHTML = types.map(fraud => `
      <div class="fraud-type-card">
        <div class="fraud-type-header">
          <h3 class="fraud-type-title">${fraud.name}</h3>
          <div class="risk-badge ${fraud.risk.toLowerCase()}">${fraud.risk}</div>
        </div>
        <div class="fraud-type-body">
          <p class="fraud-type-description">${fraud.description}</p>
          
          <div class="fraud-type-section">
            <h4>Key Indicators</h4>
            <ul>
              ${fraud.indicators.map(indicator => `<li>${indicator}</li>`).join('')}
            </ul>
          </div>
          
          <div class="fraud-type-section">
            <h4>Detection Methods</h4>
            <ul>
              ${fraud.detection_methods.map(method => `<li>${method}</li>`).join('')}
            </ul>
          </div>
          
          <div class="fraud-type-section">
            <h4>Examples</h4>
            <div class="fraud-type-examples">
              ${fraud.examples.map(ex => `<span class="example-tag">${ex}</span>`).join('')}
            </div>
          </div>
          
          <div class="fraud-type-section">
            <h4>Estimated Loss</h4>
            <p style="color: var(--color-error); font-weight: var(--font-weight-semibold); margin: 0;">${fraud.loss_estimate}</p>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  renderFraudTypes(fraudTypes);
  
  // Search functionality
  document.getElementById('fraud-search').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = fraudTypes.filter(fraud => 
      fraud.name.toLowerCase().includes(searchTerm) ||
      fraud.description.toLowerCase().includes(searchTerm) ||
      fraud.indicators.some(ind => ind.toLowerCase().includes(searchTerm))
    );
    renderFraudTypes(filtered);
  });
}

// Initialize recent cases
function initRecentCases() {
  const tbody = document.getElementById('cases-tbody');
  
  function renderCases(cases) {
    tbody.innerHTML = cases.map(caseItem => `
      <tr>
        <td>${formatDate(caseItem.date)}</td>
        <td>${caseItem.location}</td>
        <td>${caseItem.fraud_type}</td>
        <td class="amount-lost">₹${caseItem.amount_lost}</td>
        <td>${caseItem.victims}</td>
        <td><span class="status-badge ${getStatusClass(caseItem.status)}">${caseItem.status}</span></td>
        <td><button class="details-btn" onclick="showCaseDetails('${caseItem.details}')">View</button></td>
      </tr>
    `).join('');
  }
  
  renderCases(recentCases);
  
  // Filter functionality
  const filterType = document.getElementById('filter-type');
  const filterLocation = document.getElementById('filter-location');
  const searchInput = document.getElementById('case-search');
  
  function applyFilters() {
    let filtered = [...recentCases];
    
    if (filterType.value) {
      filtered = filtered.filter(c => c.fraud_type.includes(filterType.value));
    }
    
    if (filterLocation.value) {
      filtered = filtered.filter(c => c.location.includes(filterLocation.value));
    }
    
    if (searchInput.value) {
      const searchTerm = searchInput.value.toLowerCase();
      filtered = filtered.filter(c => 
        c.location.toLowerCase().includes(searchTerm) ||
        c.fraud_type.toLowerCase().includes(searchTerm) ||
        c.details.toLowerCase().includes(searchTerm)
      );
    }
    
    renderCases(filtered);
  }
  
  filterType.addEventListener('change', applyFilters);
  filterLocation.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', applyFilters);
}

// Initialize fraud news
function initFraudNews() {
  const grid = document.getElementById('news-grid');
  
  function renderNews(news) {
    grid.innerHTML = news.map(item => `
      <div class="news-card">
        <div class="news-header">
          <span class="news-date">${formatDate(item.date)}</span>
          <span class="severity-badge ${item.severity.toLowerCase()}">${item.severity}</span>
        </div>
        <h3 class="news-headline">${item.headline}</h3>
        <p class="news-excerpt">${item.excerpt}</p>
        <div class="news-meta">
          <span class="news-tag">${item.category}</span>
          <span class="news-tag">${item.source}</span>
        </div>
      </div>
    `).join('');
  }
  
  renderNews(fraudNews);
  
  // Filter functionality
  const categoryFilter = document.getElementById('news-category');
  const severityFilter = document.getElementById('news-severity');
  const searchInput = document.getElementById('news-search');
  
  function applyFilters() {
    let filtered = [...fraudNews];
    
    if (categoryFilter.value) {
      filtered = filtered.filter(n => n.category === categoryFilter.value);
    }
    
    if (severityFilter.value) {
      filtered = filtered.filter(n => n.severity === severityFilter.value);
    }
    
    if (searchInput.value) {
      const searchTerm = searchInput.value.toLowerCase();
      filtered = filtered.filter(n => 
        n.headline.toLowerCase().includes(searchTerm) ||
        n.excerpt.toLowerCase().includes(searchTerm)
      );
    }
    
    renderNews(filtered);
  }
  
  categoryFilter.addEventListener('change', applyFilters);
  severityFilter.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', applyFilters);
}

// Initialize detection methods
function initDetectionMethods() {
  const mlMethods = document.getElementById('ml-methods');
  const mlAlgorithms = detectionMethods.filter(m => 
    m.category === 'Machine Learning' || m.category === 'Deep Learning' || m.category === 'Anomaly Detection'
  );
  
  mlMethods.innerHTML = mlAlgorithms.map(method => `
    <div class="method-card">
      <h4 class="method-name">${method.name}</h4>
      <span class="method-category-tag">${method.category}</span>
      <div class="method-accuracy">Accuracy: ${method.accuracy}</div>
      <p class="method-description">${method.description}</p>
    </div>
  `).join('');
}

// Initialize alert system
function initAlertSystem() {
  renderAlerts();
}

function renderAlerts() {
  const tbody = document.getElementById('alerts-tbody');
  
  tbody.innerHTML = alertsData.map(alert => `
    <tr>
      <td><strong>${alert.stock}</strong><br><small>${alert.keyword}</small></td>
      <td>${alert.type}</td>
      <td>${alert.frequency}</td>
      <td>${alert.created}</td>
      <td><span class="status-badge ${alert.status === 'Active' ? 'resolved' : 'ongoing'}">${alert.status}</span></td>
      <td>
        <div class="alert-actions">
          <button class="action-btn toggle" onclick="toggleAlert(${alert.id})">
            ${alert.status === 'Active' ? 'Disable' : 'Enable'}
          </button>
          <button class="action-btn delete" onclick="deleteAlert(${alert.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function addAlert() {
  const stock = document.getElementById('alert-stock').value;
  const keywords = document.getElementById('alert-keywords').value;
  const type = document.getElementById('alert-type').value;
  const frequency = document.getElementById('alert-frequency').value;
  
  if (!stock || !keywords) {
    alert('Please fill in stock/company name and keywords');
    return;
  }
  
  const newAlert = {
    id: nextAlertId++,
    stock: stock,
    keyword: keywords,
    type: type,
    frequency: frequency,
    status: 'Active',
    created: formatDate(new Date().toISOString().split('T')[0])
  };
  
  alertsData.push(newAlert);
  renderAlerts();
  
  // Clear form
  document.getElementById('alert-stock').value = '';
  document.getElementById('alert-keywords').value = '';
}

function toggleAlert(id) {
  const alert = alertsData.find(a => a.id === id);
  if (alert) {
    alert.status = alert.status === 'Active' ? 'Inactive' : 'Active';
    renderAlerts();
  }
}

function deleteAlert(id) {
  alertsData = alertsData.filter(a => a.id !== id);
  renderAlerts();
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function getStatusClass(status) {
  if (status.includes('Arrested') || status.includes('Busted')) return 'arrested';
  if (status.includes('Resolved') || status.includes('Enforcement')) return 'resolved';
  return 'ongoing';
}

function showCaseDetails(details) {
  alert(details);
}

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo(btn.dataset.page);
    });
  });
  
  // Initialize all pages
  initDashboard();
  initFraudTypes();
  initRecentCases();
  initFraudNews();
  initDetectionMethods();
  initAlertSystem();
});
