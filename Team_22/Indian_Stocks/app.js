// Indian Expense Tracker Application Data
const appData = {
  demoUser: {
    name: "Rajesh Kumar",
    email: "demo@expenseai.com",
    password: "demo123",
    income: 50000,
    incomeBracket: "Mid Level"
  },
  sampleTransactions: [
    {"id": 1, "date": "2025-01-28", "description": "Swiggy Order - Biryani", "amount": 450, "category": "Food & Dining", "paymentMode": "UPI"},
    {"id": 2, "date": "2025-01-27", "description": "Uber Ride to Office", "amount": 180, "category": "Transportation", "paymentMode": "UPI"},
    {"id": 3, "date": "2025-01-26", "description": "Amazon - Phone Case", "amount": 599, "category": "Shopping", "paymentMode": "Credit Card"},
    {"id": 4, "date": "2025-01-25", "description": "BSES Electricity Bill", "amount": 2400, "category": "Bills & Utilities", "paymentMode": "Net Banking"},
    {"id": 5, "date": "2025-01-24", "description": "BookMyShow - Movie Tickets", "amount": 360, "category": "Entertainment", "paymentMode": "UPI"},
    {"id": 6, "date": "2025-01-23", "description": "Apollo Pharmacy", "amount": 280, "category": "Healthcare", "paymentMode": "Debit Card"},
    {"id": 7, "date": "2025-01-22", "description": "Indian Oil - Petrol", "amount": 2000, "category": "Transportation", "paymentMode": "Debit Card"},
    {"id": 8, "date": "2025-01-21", "description": "DMart - Groceries", "amount": 1850, "category": "Food & Dining", "paymentMode": "UPI"},
    {"id": 9, "date": "2025-01-20", "description": "Netflix Subscription", "amount": 199, "category": "Entertainment", "paymentMode": "Credit Card"},
    {"id": 10, "date": "2025-01-19", "description": "Airtel Mobile Recharge", "amount": 399, "category": "Bills & Utilities", "paymentMode": "UPI"},
    {"id": 11, "date": "2025-01-18", "description": "Myntra - Shirt", "amount": 1299, "category": "Shopping", "paymentMode": "Credit Card"},
    {"id": 12, "date": "2025-01-17", "description": "Zomato - Lunch", "amount": 320, "category": "Food & Dining", "paymentMode": "UPI"},
    {"id": 13, "date": "2025-01-16", "description": "Ola Auto Ride", "amount": 65, "category": "Transportation", "paymentMode": "UPI"},
    {"id": 14, "date": "2025-01-15", "description": "SIP Investment - Mutual Fund", "amount": 5000, "category": "Investment & Savings", "paymentMode": "Net Banking"},
    {"id": 15, "date": "2025-01-14", "description": "1mg Medicine Order", "amount": 450, "category": "Healthcare", "paymentMode": "UPI"}
  ],
  incomeBrackets: [
    {"name": "Entry Level", "range": "₹15,000 - ₹30,000", "min": 15000, "max": 30000},
    {"name": "Mid Level", "range": "₹30,000 - ₹75,000", "min": 30000, "max": 75000},
    {"name": "High Income", "range": "₹75,000+", "min": 75000, "max": 999999}
  ],
  budgetTemplates: {
    "Entry Level": {
      "Food & Dining": 6000,
      "Transportation": 3000,
      "Bills & Utilities": 4000,
      "Shopping": 3000,
      "Healthcare": 2000,
      "Entertainment": 1500,
      "Education": 1000,
      "Investment & Savings": 3000,
      "Family & Personal": 2000
    },
    "Mid Level": {
      "Food & Dining": 10000,
      "Transportation": 6000,
      "Bills & Utilities": 7000,
      "Shopping": 8000,
      "Healthcare": 4000,
      "Entertainment": 3500,
      "Education": 2500,
      "Investment & Savings": 12000,
      "Family & Personal": 5000
    },
    "High Income": {
      "Food & Dining": 15000,
      "Transportation": 10000,
      "Bills & Utilities": 10000,
      "Shopping": 15000,
      "Healthcare": 8000,
      "Entertainment": 8000,
      "Education": 5000,
      "Investment & Savings": 25000,
      "Family & Personal": 10000
    }
  },
  categories: [
    {"name": "Food & Dining", "icon": "🍽️", "color": "#FF6B6B", "subcategories": ["Restaurants", "Groceries", "Street Food", "Sweets", "Tea/Coffee"]},
    {"name": "Transportation", "icon": "🚗", "color": "#4ECDC4", "subcategories": ["Petrol/Diesel", "Auto/Taxi", "Bus/Metro", "Parking", "Vehicle Maintenance"]},
    {"name": "Bills & Utilities", "icon": "💡", "color": "#96CEB4", "subcategories": ["Electricity", "Water", "Gas (LPG)", "Internet", "Mobile", "DTH/Cable"]},
    {"name": "Shopping", "icon": "🛍️", "color": "#45B7D1", "subcategories": ["Clothing", "Electronics", "Home Items", "Personal Care", "Books"]},
    {"name": "Healthcare", "icon": "🏥", "color": "#FF9FF3", "subcategories": ["Medical Bills", "Medicine", "Health Insurance", "Gym/Fitness", "Dental"]},
    {"name": "Entertainment", "icon": "🎬", "color": "#FECA57", "subcategories": ["Movies", "OTT Subscriptions", "Games", "Events", "Sports"]},
    {"name": "Education", "icon": "📚", "color": "#5F27CD", "subcategories": ["Fees", "Books", "Online Courses", "Coaching", "Stationery"]},
    {"name": "Investment & Savings", "icon": "💰", "color": "#00D2D3", "subcategories": ["SIP/Mutual Funds", "FD/RD", "PPF", "Insurance Premium", "Gold"]},
    {"name": "Family & Personal", "icon": "👨‍👩‍👧‍👦", "color": "#C8C8C8", "subcategories": ["Gifts", "Family Support", "Personal Loan EMI", "Charity", "Festivals"]}
  ],
  indianMerchants: [
    {"name": "Swiggy", "category": "Food & Dining", "keywords": ["swiggy", "food delivery"]},
    {"name": "Zomato", "category": "Food & Dining", "keywords": ["zomato", "food delivery"]},
    {"name": "BigBasket", "category": "Food & Dining", "keywords": ["bigbasket", "groceries"]},
    {"name": "DMart", "category": "Food & Dining", "keywords": ["dmart", "groceries"]},
    {"name": "Uber", "category": "Transportation", "keywords": ["uber", "ride"]},
    {"name": "Ola", "category": "Transportation", "keywords": ["ola", "ride", "auto"]},
    {"name": "Indian Oil", "category": "Transportation", "keywords": ["indian oil", "petrol", "fuel"]},
    {"name": "BSES", "category": "Bills & Utilities", "keywords": ["bses", "electricity", "power"]},
    {"name": "Airtel", "category": "Bills & Utilities", "keywords": ["airtel", "mobile", "recharge"]},
    {"name": "Jio", "category": "Bills & Utilities", "keywords": ["jio", "mobile", "recharge"]},
    {"name": "Amazon", "category": "Shopping", "keywords": ["amazon", "online shopping"]},
    {"name": "Flipkart", "category": "Shopping", "keywords": ["flipkart", "online shopping"]},
    {"name": "Myntra", "category": "Shopping", "keywords": ["myntra", "fashion", "clothes"]},
    {"name": "Netflix", "category": "Entertainment", "keywords": ["netflix", "subscription", "ott"]},
    {"name": "BookMyShow", "category": "Entertainment", "keywords": ["bookmyshow", "movie", "tickets"]},
    {"name": "Apollo Pharmacy", "category": "Healthcare", "keywords": ["apollo", "pharmacy", "medicine"]},
    {"name": "1mg", "category": "Healthcare", "keywords": ["1mg", "medicine", "health"]}
  ],
  paymentModes: [
    {"mode": "UPI", "icon": "📱", "color": "#4CAF50"},
    {"mode": "Debit Card", "icon": "💳", "color": "#2196F3"},
    {"mode": "Credit Card", "icon": "💳", "color": "#FF9800"},
    {"mode": "Cash", "icon": "💵", "color": "#795548"},
    {"mode": "Net Banking", "icon": "🏦", "color": "#9C27B0"}
  ]
};

// Global Application State
let currentUser = null;
let currentTransactions = [];
let currentBudgets = {};
let monthlyIncome = 0;
let charts = {};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing app...');
  initializeApp();
});

function initializeApp() {
  try {
    checkAuthStatus();
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

function setupEventListeners() {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Signup form
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  // Navigation between auth pages
  const showSignupBtn = document.getElementById('show-signup');
  if (showSignupBtn) {
    showSignupBtn.addEventListener('click', showSignupPage);
  }

  const showLoginBtn = document.getElementById('show-login');
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', showLoginPage);
  }

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// Authentication Functions
function checkAuthStatus() {
  try {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      currentUser = JSON.parse(userData);
      showMainApp();
    } else {
      showLoginPage();
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    showLoginPage();
  }
}

function showLoginPage() {
  const loginPage = document.getElementById('login-page');
  const signupPage = document.getElementById('signup-page');
  const mainApp = document.getElementById('main-app');
  
  if (loginPage) loginPage.classList.remove('hidden');
  if (signupPage) signupPage.classList.add('hidden');
  if (mainApp) mainApp.classList.add('hidden');
}

function showSignupPage() {
  const loginPage = document.getElementById('login-page');
  const signupPage = document.getElementById('signup-page');
  const mainApp = document.getElementById('main-app');
  
  if (loginPage) loginPage.classList.add('hidden');
  if (signupPage) signupPage.classList.remove('hidden');
  if (mainApp) mainApp.classList.add('hidden');
}

function showMainApp() {
  const loginPage = document.getElementById('login-page');
  const signupPage = document.getElementById('signup-page');
  const mainApp = document.getElementById('main-app');
  
  if (loginPage) loginPage.classList.add('hidden');
  if (signupPage) signupPage.classList.add('hidden');
  if (mainApp) mainApp.classList.remove('hidden');
  
  // Load user data and initialize app
  loadUserData();
  initializeMainApp();
}

function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  console.log('Login attempt:', email);

  // Check demo credentials
  if (email === appData.demoUser.email && password === appData.demoUser.password) {
    currentUser = { ...appData.demoUser };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    console.log('Demo login successful');
    showMainApp();
    return;
  }

  // Check registered users
  const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    console.log('User login successful');
    showMainApp();
  } else {
    alert('Invalid credentials. Use demo@expenseai.com / demo123 for demo access.');
  }
}

function handleSignup(e) {
  e.preventDefault();
  
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm').value;

  if (password !== confirmPassword) {
    alert('Passwords do not match!');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters long!');
    return;
  }

  // Check if user already exists
  const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  if (users.find(u => u.email === email)) {
    alert('User with this email already exists!');
    return;
  }

  // Create new user
  const newUser = {
    name,
    email,
    password,
    income: 30000,
    incomeBracket: "Mid Level"
  };

  users.push(newUser);
  localStorage.setItem('registeredUsers', JSON.stringify(users));

  alert('Account created successfully! Please login.');
  showLoginPage();
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('currentUser');
    currentUser = null;
    currentTransactions = [];
    currentBudgets = {};
    monthlyIncome = 0;
    
    // Destroy charts
    Object.values(charts).forEach(chart => {
      try {
        chart.destroy();
      } catch (e) {
        console.log('Chart destroy error:', e);
      }
    });
    charts = {};
    
    showLoginPage();
  }
}

function loadUserData() {
  // Load user-specific data from localStorage
  const userDataKey = `userData_${currentUser.email}`;
  const userData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
  
  currentTransactions = userData.transactions || [...appData.sampleTransactions];
  currentBudgets = userData.budgets || { ...appData.budgetTemplates["Mid Level"] };
  monthlyIncome = userData.income || currentUser.income || 50000;

  // Update UI with user name
  const userNameElem = document.getElementById('user-name');
  const userNameSettingElem = document.getElementById('user-name-setting');
  const userEmailSettingElem = document.getElementById('user-email-setting');
  
  if (userNameElem) userNameElem.textContent = currentUser.name;
  if (userNameSettingElem) userNameSettingElem.value = currentUser.name;
  if (userEmailSettingElem) userEmailSettingElem.value = currentUser.email;
}

function saveUserData() {
  const userDataKey = `userData_${currentUser.email}`;
  const userData = {
    transactions: currentTransactions,
    budgets: currentBudgets,
    income: monthlyIncome
  };
  localStorage.setItem(userDataKey, JSON.stringify(userData));
}

function initializeMainApp() {
  console.log('Initializing main app...');
  try {
    initializeNavigation();
    initializeExpenseForm();
    initializeBudgetSection();
    initializeSettings();
    initializeReports();
    updateDashboard();
    setDefaultDate();
  } catch (error) {
    console.error('Error initializing main app:', error);
  }
}

// Navigation
function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSection = link.getAttribute('data-section');
      
      // Update active nav link
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Show target section
      sections.forEach(s => s.classList.remove('active'));
      const targetElement = document.getElementById(targetSection);
      if (targetElement) {
        targetElement.classList.add('active');
      }
      
      // Update section-specific content
      if (targetSection === 'dashboard') {
        updateDashboard();
      } else if (targetSection === 'budget') {
        updateBudgetSection();
      } else if (targetSection === 'reports') {
        updateReports();
      }
    });
  });
}

// Expense Form Functions
function initializeExpenseForm() {
  const form = document.getElementById('expense-form');
  const quickForm = document.getElementById('quick-expense-form');
  const descriptionInput = document.getElementById('expense-description');
  
  // Populate dropdowns
  populateCategories();
  populatePaymentModes();
  createCategoryIcons();

  // AI suggestion on description input
  if (descriptionInput) {
    descriptionInput.addEventListener('input', (e) => {
      const description = e.target.value.toLowerCase();
      if (description.length > 2) {
        const suggestedCategory = suggestCategory(description);
        if (suggestedCategory) {
          showAISuggestion(suggestedCategory);
          const categorySelect = document.getElementById('expense-category');
          if (categorySelect) {
            categorySelect.value = suggestedCategory;
            updateSelectedCategoryIcon(suggestedCategory);
          }
        }
      } else {
        hideAISuggestion();
      }
    });
  }

  // Form submissions
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      addExpense();
    });
  }

  if (quickForm) {
    quickForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addQuickExpense();
    });
  }
}

function populateCategories() {
  const selects = [
    document.getElementById('expense-category'),
    document.getElementById('quick-category')
  ];
  
  selects.forEach(select => {
    if (select) {
      // Clear existing options except first
      select.innerHTML = '<option value="">Select category...</option>';
      
      appData.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = `${category.icon} ${category.name}`;
        select.appendChild(option);
      });
    }
  });
}

function populatePaymentModes() {
  const paymentSelect = document.getElementById('expense-payment');
  if (paymentSelect) {
    paymentSelect.innerHTML = '<option value="">Select payment...</option>';
    
    appData.paymentModes.forEach(payment => {
      const option = document.createElement('option');
      option.value = payment.mode;
      option.textContent = `${payment.icon} ${payment.mode}`;
      paymentSelect.appendChild(option);
    });
  }
}

function createCategoryIcons() {
  const container = document.getElementById('category-icons');
  if (container) {
    container.innerHTML = '';
    
    appData.categories.forEach(category => {
      const iconDiv = document.createElement('div');
      iconDiv.className = 'category-icon';
      iconDiv.setAttribute('data-category', category.name);
      iconDiv.innerHTML = `
        <div class="category-icon-emoji">${category.icon}</div>
        <div>${category.name.split(' ')[0]}</div>
      `;
      iconDiv.addEventListener('click', () => {
        selectCategory(category.name);
      });
      container.appendChild(iconDiv);
    });
  }
}

function selectCategory(categoryName) {
  const categorySelect = document.getElementById('expense-category');
  if (categorySelect) {
    categorySelect.value = categoryName;
    updateSelectedCategoryIcon(categoryName);
  }
}

function updateSelectedCategoryIcon(categoryName) {
  const icons = document.querySelectorAll('.category-icon');
  icons.forEach(icon => {
    icon.classList.remove('selected');
    if (icon.getAttribute('data-category') === categoryName) {
      icon.classList.add('selected');
    }
  });
}

function suggestCategory(description) {
  // Check Indian merchants first
  for (const merchant of appData.indianMerchants) {
    for (const keyword of merchant.keywords) {
      if (description.includes(keyword)) {
        return merchant.category;
      }
    }
  }

  // General category matching
  const categoryPatterns = {
    "Food & Dining": ["food", "restaurant", "cafe", "lunch", "dinner", "breakfast", "grocery", "biryani", "pizza"],
    "Transportation": ["uber", "ola", "petrol", "diesel", "fuel", "taxi", "auto", "bus", "metro", "parking"],
    "Shopping": ["amazon", "flipkart", "myntra", "shopping", "clothes", "electronics", "purchase"],
    "Bills & Utilities": ["electricity", "water", "gas", "internet", "mobile", "recharge", "bill", "utility"],
    "Entertainment": ["movie", "netflix", "bookmyshow", "entertainment", "subscription", "ott", "gaming"],
    "Healthcare": ["pharmacy", "medicine", "doctor", "hospital", "health", "medical", "apollo", "1mg"],
    "Investment & Savings": ["sip", "mutual fund", "investment", "savings", "insurance", "ppf"],
    "Family & Personal": ["gift", "family", "personal", "festival", "charity", "emi"]
  };

  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    if (patterns.some(pattern => description.includes(pattern))) {
      return category;
    }
  }
  
  return null;
}

function showAISuggestion(category) {
  const suggestion = document.getElementById('ai-suggestion');
  if (suggestion) {
    const suggestionText = suggestion.querySelector('.suggestion-text strong');
    if (suggestionText) {
      suggestionText.textContent = category;
      suggestion.style.display = 'flex';
    }
  }
}

function hideAISuggestion() {
  const suggestion = document.getElementById('ai-suggestion');
  if (suggestion) {
    suggestion.style.display = 'none';
  }
}

function addExpense() {
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const description = document.getElementById('expense-description').value;
  const date = document.getElementById('expense-date').value;
  const category = document.getElementById('expense-category').value;
  const paymentMode = document.getElementById('expense-payment').value;

  if (!amount || !description || !date || !category || !paymentMode) {
    alert('Please fill all fields');
    return;
  }

  const newExpense = {
    id: Date.now(),
    date,
    description,
    amount,
    category,
    paymentMode
  };

  currentTransactions.unshift(newExpense);
  saveUserData();
  
  // Reset form
  document.getElementById('expense-form').reset();
  hideAISuggestion();
  updateSelectedCategoryIcon('');
  setDefaultDate();
  
  // Update dashboard
  updateDashboard();
  
  alert('Expense added successfully! 💰');
}

function addQuickExpense() {
  const amount = parseFloat(document.getElementById('quick-amount').value);
  const description = document.getElementById('quick-description').value;
  const category = document.getElementById('quick-category').value;

  if (!amount || !description || !category) {
    alert('Please fill all fields');
    return;
  }

  const newExpense = {
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    description,
    amount,
    category,
    paymentMode: "UPI" // Default to UPI for quick entries
  };

  currentTransactions.unshift(newExpense);
  saveUserData();
  
  // Reset form
  document.getElementById('quick-expense-form').reset();
  
  // Update dashboard
  updateDashboard();
  
  alert('Quick expense added! 🚀');
}

function setDefaultDate() {
  const dateInput = document.getElementById('expense-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
}

// Budget Section Functions
function initializeBudgetSection() {
  const incomeInput = document.getElementById('monthly-income');
  const incomeBracketSelect = document.getElementById('income-bracket');
  const applyBudgetBtn = document.getElementById('apply-smart-budget');

  // Populate income brackets
  if (incomeBracketSelect) {
    appData.incomeBrackets.forEach(bracket => {
      const option = document.createElement('option');
      option.value = bracket.name;
      option.textContent = `${bracket.name} (${bracket.range})`;
      incomeBracketSelect.appendChild(option);
    });
  }

  if (incomeInput) {
    incomeInput.value = monthlyIncome;
    incomeBracketSelect.value = currentUser.incomeBracket || "Mid Level";
    
    incomeInput.addEventListener('input', (e) => {
      monthlyIncome = parseFloat(e.target.value) || 0;
      updateBudgetSummary();
      saveUserData();
    });
  }

  if (applyBudgetBtn) {
    applyBudgetBtn.addEventListener('click', () => {
      const bracket = incomeBracketSelect.value;
      applySmartBudget(bracket);
    });
  }

  createBudgetSliders();
  updateBudgetSection();
}

function applySmartBudget(bracket) {
  if (bracket && appData.budgetTemplates[bracket]) {
    currentBudgets = { ...appData.budgetTemplates[bracket] };
    updateBudgetSliders();
    updateBudgetSummary();
    saveUserData();
    alert(`Smart budget for ${bracket} applied! 🎯`);
  }
}

function createBudgetSliders() {
  const container = document.getElementById('budget-sliders');
  if (!container) return;
  
  container.innerHTML = '';

  appData.categories.forEach(category => {
    const sliderDiv = document.createElement('div');
    sliderDiv.className = 'budget-slider';
    sliderDiv.innerHTML = `
      <div class="slider-header">
        <div class="slider-category">
          <span>${category.icon}</span>
          <span>${category.name}</span>
        </div>
        <div class="slider-amount">₹<span id="amount-${category.name.replace(/\s+/g, '-')}">${currentBudgets[category.name] || 0}</span></div>
      </div>
      <input type="range" class="slider-input" 
             id="slider-${category.name.replace(/\s+/g, '-')}"
             min="0" max="30000" step="500" 
             value="${currentBudgets[category.name] || 0}">
    `;
    container.appendChild(sliderDiv);

    const slider = sliderDiv.querySelector('.slider-input');
    const amountSpan = sliderDiv.querySelector('.slider-amount span');
    
    slider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      amountSpan.textContent = value;
      currentBudgets[category.name] = value;
      updateBudgetSummary();
      saveUserData();
    });
  });
}

function updateBudgetSliders() {
  appData.categories.forEach(category => {
    const slider = document.getElementById(`slider-${category.name.replace(/\s+/g, '-')}`);
    const amount = document.getElementById(`amount-${category.name.replace(/\s+/g, '-')}`);
    
    if (slider && amount) {
      slider.value = currentBudgets[category.name] || 0;
      amount.textContent = currentBudgets[category.name] || 0;
    }
  });
}

function updateBudgetSummary() {
  const totalBudget = Object.values(currentBudgets).reduce((sum, amount) => sum + amount, 0);
  const remaining = monthlyIncome - totalBudget;
  
  const totalBudgetElem = document.getElementById('total-budget');
  const remainingIncomeElem = document.getElementById('remaining-income');
  
  if (totalBudgetElem) totalBudgetElem.textContent = `₹${totalBudget.toLocaleString('en-IN')}`;
  if (remainingIncomeElem) remainingIncomeElem.textContent = `₹${remaining.toLocaleString('en-IN')}`;
  
  updateBudgetProgress();
}

function updateBudgetSection() {
  updateBudgetSliders();
  updateBudgetSummary();
  updateBudgetProgress();
}

function updateBudgetProgress() {
  const container = document.getElementById('budget-progress-bars');
  if (!container) return;
  
  container.innerHTML = '';

  // Calculate spending by category
  const spendingByCategory = {};
  appData.categories.forEach(cat => {
    spendingByCategory[cat.name] = 0;
  });

  currentTransactions.forEach(transaction => {
    if (spendingByCategory.hasOwnProperty(transaction.category)) {
      spendingByCategory[transaction.category] += transaction.amount;
    }
  });

  // Create progress bars
  appData.categories.forEach(category => {
    const spent = spendingByCategory[category.name] || 0;
    const budget = currentBudgets[category.name] || 0;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    const isOverBudget = percentage > 100;

    const progressDiv = document.createElement('div');
    progressDiv.className = 'progress-item';
    progressDiv.innerHTML = `
      <div class="progress-header">
        <div class="progress-category">
          <span>${category.icon}</span>
          <span>${category.name}</span>
        </div>
        <div class="progress-amounts">₹${spent.toLocaleString('en-IN')} / ₹${budget.toLocaleString('en-IN')}</div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${isOverBudget ? 'over-budget' : ''}" 
             style="width: ${Math.min(percentage, 100)}%"></div>
      </div>
    `;
    container.appendChild(progressDiv);
  });
}

// Dashboard Functions
function updateDashboard() {
  updateStats();
  updateRecentTransactions();
  updateCharts();
}

function updateStats() {
  const totalSpent = currentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalBudget = Object.values(currentBudgets).reduce((sum, amount) => sum + amount, 0);
  const budgetRemaining = totalBudget - totalSpent;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - totalSpent) / monthlyIncome * 100) : 0;

  const totalSpentElem = document.getElementById('total-spent');
  const budgetRemainingElem = document.getElementById('budget-remaining');
  const savingsRateElem = document.getElementById('savings-rate');
  const transactionsCountElem = document.getElementById('transactions-count');

  if (totalSpentElem) totalSpentElem.textContent = `₹${totalSpent.toLocaleString('en-IN')}`;
  if (budgetRemainingElem) budgetRemainingElem.textContent = `₹${Math.max(budgetRemaining, 0).toLocaleString('en-IN')}`;
  if (savingsRateElem) savingsRateElem.textContent = `${Math.max(savingsRate, 0).toFixed(1)}%`;
  if (transactionsCountElem) transactionsCountElem.textContent = currentTransactions.length;
}

function updateRecentTransactions() {
  const container = document.getElementById('recent-transactions');
  if (!container) return;
  
  container.innerHTML = '';

  const recentTransactions = currentTransactions.slice(0, 8);
  
  recentTransactions.forEach(transaction => {
    const category = appData.categories.find(cat => cat.name === transaction.category);
    const paymentMode = appData.paymentModes.find(pm => pm.mode === transaction.paymentMode);
    
    const transactionDiv = document.createElement('div');
    transactionDiv.className = 'transaction-item';
    transactionDiv.innerHTML = `
      <div class="transaction-info">
        <div class="transaction-icon" style="background-color: ${category?.color || '#C8C8C8'}20;">
          ${category?.icon || '📦'}
        </div>
        <div class="transaction-details">
          <h4>${transaction.description}</h4>
          <p>${transaction.category} • ${new Date(transaction.date).toLocaleDateString('en-IN')}
            <span class="payment-mode">${paymentMode?.icon || '💳'} ${transaction.paymentMode}</span>
          </p>
        </div>
      </div>
      <div class="transaction-amount">-₹${transaction.amount.toLocaleString('en-IN')}</div>
    `;
    container.appendChild(transactionDiv);
  });
}

function updateCharts() {
  createSpendingTrendChart();
  createCategoryChart();
}

function createSpendingTrendChart() {
  const canvas = document.getElementById('spending-trend-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  if (charts.spendingTrend) {
    charts.spendingTrend.destroy();
  }

  // Generate last 7 days data
  const last7Days = [];
  const spendingData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push(date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
    
    const daySpending = currentTransactions
      .filter(t => new Date(t.date).toDateString() === date.toDateString())
      .reduce((sum, t) => sum + t.amount, 0);
    spendingData.push(daySpending);
  }

  charts.spendingTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: last7Days,
      datasets: [{
        label: 'Daily Spending',
        data: spendingData,
        borderColor: '#1FB8CD',
        backgroundColor: 'rgba(31, 184, 205, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value.toLocaleString('en-IN');
            }
          }
        }
      }
    }
  });
}

function createCategoryChart() {
  const canvas = document.getElementById('category-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  if (charts.category) {
    charts.category.destroy();
  }

  // Calculate spending by category
  const categorySpending = {};
  appData.categories.forEach(cat => {
    categorySpending[cat.name] = 0;
  });

  currentTransactions.forEach(transaction => {
    if (categorySpending.hasOwnProperty(transaction.category)) {
      categorySpending[transaction.category] += transaction.amount;
    }
  });

  const labels = [];
  const data = [];
  const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454'];

  Object.entries(categorySpending).forEach(([category, amount], index) => {
    if (amount > 0) {
      labels.push(category);
      data.push(amount);
    }
  });

  charts.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 15
          }
        }
      }
    }
  });
}

// Reports Functions
function initializeReports() {
  const timePeriodButtons = document.querySelectorAll('.time-selector .btn');
  
  timePeriodButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      timePeriodButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      updateReports();
    });
  });
}

function updateReports() {
  updateSpendingInsights();
  updatePaymentAnalysis();
}

function updateSpendingInsights() {
  const container = document.getElementById('spending-insights');
  if (!container) return;
  
  container.innerHTML = '';

  // Calculate insights
  const totalSpent = currentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const avgPerDay = totalSpent / 30;
  const categorySpending = {};
  
  appData.categories.forEach(cat => {
    categorySpending[cat.name] = currentTransactions
      .filter(t => t.category === cat.name)
      .reduce((sum, t) => sum + t.amount, 0);
  });

  const topCategory = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)[0];

  if (!topCategory || topCategory[1] === 0) {
    container.innerHTML = '<p>No spending data available yet. Add some expenses to see insights!</p>';
    return;
  }

  const insights = [
    { icon: '📊', text: `Your top spending category is ${topCategory[0]} with ₹${topCategory[1].toLocaleString('en-IN')}` },
    { icon: '💡', text: `You spend an average of ₹${avgPerDay.toFixed(0)} per day` },
    { icon: '🎯', text: `${Math.round(Math.max(0, (currentBudgets[topCategory[0]] - topCategory[1]) / Math.max(1, currentBudgets[topCategory[0]]) * 100))}% of ${topCategory[0]} budget remaining` },
    { icon: '📱', text: `UPI is your preferred payment method for ${Math.round(currentTransactions.filter(t => t.paymentMode === 'UPI').length / Math.max(1, currentTransactions.length) * 100)}% of transactions` },
    { icon: '✅', text: `You've made ${currentTransactions.length} transactions this month` }
  ];

  insights.forEach(insight => {
    const insightDiv = document.createElement('div');
    insightDiv.className = 'insight-item';
    insightDiv.innerHTML = `
      <div class="insight-icon">${insight.icon}</div>
      <div>${insight.text}</div>
    `;
    container.appendChild(insightDiv);
  });
}

function updatePaymentAnalysis() {
  const container = document.getElementById('payment-analysis');
  if (!container) return;
  
  container.innerHTML = '';

  const paymentStats = {};
  appData.paymentModes.forEach(pm => {
    paymentStats[pm.mode] = {
      count: 0,
      amount: 0,
      icon: pm.icon
    };
  });

  currentTransactions.forEach(transaction => {
    if (paymentStats[transaction.paymentMode]) {
      paymentStats[transaction.paymentMode].count++;
      paymentStats[transaction.paymentMode].amount += transaction.amount;
    }
  });

  Object.entries(paymentStats).forEach(([mode, stats]) => {
    if (stats.count > 0) {
      const statDiv = document.createElement('div');
      statDiv.className = 'payment-stat';
      statDiv.innerHTML = `
        <div class="payment-stat-info">
          <span>${stats.icon}</span>
          <span>${mode}</span>
        </div>
        <div>
          <div>₹${stats.amount.toLocaleString('en-IN')}</div>
          <small>${stats.count} transactions</small>
        </div>
      `;
      container.appendChild(statDiv);
    }
  });
}

// Settings Functions
function initializeSettings() {
  const currencySelect = document.getElementById('currency');
  const languageSelect = document.getElementById('language');
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');

  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      console.log('Currency changed to:', e.target.value);
      // Could implement currency conversion here
    });
  }

  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      console.log('Language changed to:', e.target.value);
      // Could implement language switching here
    });
  }

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      console.log(`${e.target.id} changed to:`, e.target.checked);
      // Save preferences
    });
  });
}