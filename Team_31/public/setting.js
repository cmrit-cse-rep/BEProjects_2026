// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // =====================================================
  // INITIALIZATION
  // =====================================================
  
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser || !currentUser.email) {
    // Redirect to login if not authenticated
    window.location.href = 'landingpage.html';
    return;
  }
  
  // Load user data on page load
  loadUserData();
  
  // Get elements
  const menuItems = document.querySelectorAll('.menu-item');
  const settingsSections = document.querySelectorAll('.settings-section');
  const logoutBtn = document.getElementById('logout-btn');
  const logoutModal = document.getElementById('logout-modal');
  const cancelLogoutBtn = document.getElementById('cancel-logout');
  const confirmLogoutBtn = document.getElementById('confirm-logout');
  const closeModalBtn = document.querySelector('.close-modal');
  const themeOptions = document.querySelectorAll('.theme-option');
  const fontOptions = document.querySelectorAll('.font-option');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  const navLinkItems = document.querySelectorAll('.nav-link');
  
  // =====================================================
  // FUNCTIONS
  // =====================================================
  
  /**
   * Load user data from localStorage and populate the settings forms
   */
  function loadUserData() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const userPreferences = JSON.parse(localStorage.getItem('userPreferences')) || {};
    
    if (user) {
      // Update header if present
      const headerNameEl = document.querySelector('.user-name');
      const headerEmailEl = document.querySelector('.user-email');
      const avatarEl = document.querySelector('.avatar-placeholder');

      if (headerNameEl) headerNameEl.textContent = user.name || 'User';
      if (headerEmailEl) headerEmailEl.textContent = user.email;
      if (avatarEl) avatarEl.textContent = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

      // Update account form fields if present
      const fullnameEl = document.getElementById('fullname');
      const emailEl = document.getElementById('email');
      const bioEl = document.getElementById('bio');

      if (fullnameEl) fullnameEl.value = user.name || '';
      if (emailEl) emailEl.value = user.email;
      if (bioEl) bioEl.value = userPreferences.bio || '';
    }
    
    // Load theme preference (robust; avoid unsupported selectors)
    const savedTheme = localStorage.getItem('userTheme') || 'light';
    const themeOptionNodes = document.querySelectorAll('.theme-option');
    if (themeOptionNodes && themeOptionNodes.length) {
      themeOptionNodes.forEach(opt => opt.classList.remove('active'));
      // Try to match by data-theme attribute or inner span text
      let matched = false;
      themeOptionNodes.forEach(opt => {
        const span = opt.querySelector('span');
        const text = span ? span.textContent.trim().toLowerCase() : '';
        const dataTheme = opt.dataset && opt.dataset.theme ? String(opt.dataset.theme).toLowerCase() : '';
        if (text === savedTheme.toLowerCase() || dataTheme === savedTheme.toLowerCase()) {
          opt.classList.add('active');
          matched = true;
        }
      });
      // Fallback: mark first option active
      if (!matched) themeOptionNodes[0].classList.add('active');
    }
    
    // Load font preference
    const savedFontSize = localStorage.getItem('userFontSize') || 'medium';
    document.querySelectorAll('.font-option').forEach(opt => {
      opt.classList.remove('active');
    });
    document.querySelectorAll('.font-option').forEach(opt => {
      if (opt.textContent.toLowerCase() === savedFontSize.toLowerCase()) {
        opt.classList.add('active');
      }
    });
    
    // Load notification preferences
    // Load notification preferences (guard against pages that don't include these controls)
    const emailNotifications = JSON.parse(localStorage.getItem('emailNotifications')) ?? true;
    const newsletter = JSON.parse(localStorage.getItem('newsletter')) ?? true;
    const communityUpdates = JSON.parse(localStorage.getItem('communityUpdates')) ?? false;

    const notificationCheckboxes = document.querySelectorAll('.notification-option input[type="checkbox"]');
    if (notificationCheckboxes && notificationCheckboxes.length >= 3) {
      notificationCheckboxes[0].checked = emailNotifications;
      notificationCheckboxes[1].checked = newsletter;
      notificationCheckboxes[2].checked = communityUpdates;
    }

    // Load privacy preferences (guarded)
    const profileVisibility = localStorage.getItem('profileVisibility') || 'members';
    const activityStatus = JSON.parse(localStorage.getItem('activityStatus')) ?? true;
    const dataUsage = JSON.parse(localStorage.getItem('dataUsage')) ?? true;

    const privacySelect = document.querySelector('.privacy-select');
    if (privacySelect) privacySelect.value = profileVisibility;

    const privacyCheckboxes = document.querySelectorAll('.privacy-option input[type="checkbox"]');
    if (privacyCheckboxes && privacyCheckboxes.length >= 2) {
      privacyCheckboxes[0].checked = activityStatus;
      privacyCheckboxes[1].checked = dataUsage;
    }
  }
  
  /**
   * Capitalize first letter of string
   */
  function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Show success message
   */
  function showSuccessMessage(message = 'Changes saved successfully!') {
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = message;
    successMessage.style.cssText = `
      padding: 1rem;
      margin-top: 1rem;
      background-color: rgba(76, 175, 80, 0.2);
      color: #2e7d32;
      border: 1px solid #4caf50;
      border-radius: 0.5rem;
      animation: slideDown 0.3s ease-out;
      font-weight: 500;
    `;
    
    // Find the active section and append to it
    const activeSection = document.querySelector('.settings-section.active');
    if (activeSection) {
      // Remove previous success message if exists
      const oldMsg = activeSection.querySelector('.success-message');
      if (oldMsg) oldMsg.remove();
      
      activeSection.appendChild(successMessage);
      
      // Remove after 3 seconds
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
    }
  }
  
  /**
   * Show error message
   */
  function showErrorMessage(message = 'Something went wrong!') {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;
    errorMessage.style.cssText = `
      padding: 1rem;
      margin-top: 1rem;
      background-color: rgba(244, 67, 54, 0.2);
      color: #c62828;
      border: 1px solid #f44336;
      border-radius: 0.5rem;
      animation: slideDown 0.3s ease-out;
      font-weight: 500;
    `;
    
    const activeSection = document.querySelector('.settings-section.active');
    if (activeSection) {
      const oldMsg = activeSection.querySelector('.error-message');
      if (oldMsg) oldMsg.remove();
      
      activeSection.appendChild(errorMessage);
      
      setTimeout(() => {
        errorMessage.remove();
      }, 4000);
    }
  }
  
  /**
   * Validate email format
   */
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validate password strength
   */
  function validatePassword(password) {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true, message: 'Password is strong' };
  }
  
  // Toggle between settings sections (Account stays inline; other items open separate pages)
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remove active class from all menu items
      menuItems.forEach(mi => mi.classList.remove('active'));
      // Add active class to clicked menu item
      this.classList.add('active');

      const sectionId = this.getAttribute('data-section');

      // For the main 'account' section, show inline content. For others, navigate to dedicated pages.
      if (sectionId === 'account') {
        // Hide all settings sections and set display none
        settingsSections.forEach(section => {
          section.classList.remove('active');
          section.style.display = 'none';
        });

        const target = document.getElementById('account');
        if (target) {
          target.classList.add('active');
          target.style.display = '';
        }
        return;
      }

      // Map section ids to dedicated pages
      const pageMap = {
        notifications: 'notifications-settings.html',
        privacy: 'privacy-settings.html',
        appearance: 'appearance-settings.html'
      };

      const dest = pageMap[sectionId];
      if (dest) {
        // Use relative navigation so it works when served
        window.location.href = dest;
      } else {
        // Fallback: attempt to show inline if present
        const target = document.getElementById(sectionId);
        if (target) {
          settingsSections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
          });
          target.classList.add('active');
          target.style.display = '';
        }
      }
    });
  });
  
  // Handle theme selection
  themeOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Remove active class from all theme options
      themeOptions.forEach(opt => opt.classList.remove('active'));
      // Add active class to clicked theme option
      this.classList.add('active');
      
      // Get theme name from span text
      const themeName = this.querySelector('span').textContent.toLowerCase();
      localStorage.setItem('userTheme', themeName);
      
      // Apply theme to document
      applyTheme(themeName);
    });
  });
  
  /**
   * Apply theme to the entire app
   */
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)';
    } else if (theme === 'light') {
      document.documentElement.style.filter = 'none';
    }
    // System theme would use prefers-color-scheme
  }
  
  // Handle font size selection
  fontOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Remove active class from all font options
      fontOptions.forEach(opt => opt.classList.remove('active'));
      // Add active class to clicked font option
      this.classList.add('active');
      
      // Get font size
      const fontSize = this.textContent.toLowerCase();
      localStorage.setItem('userFontSize', fontSize);
      
      // Apply font size
      applyFontSize(fontSize);
    });
  });
  
  /**
   * Apply font size to the app
   */
  function applyFontSize(size) {
    let rootFontSize = '16px';
    if (size === 'small') rootFontSize = '14px';
    if (size === 'medium') rootFontSize = '16px';
    if (size === 'large') rootFontSize = '18px';
    
    document.documentElement.style.fontSize = rootFontSize;
  }
  
  // Show logout confirmation modal
  // Show/hide logout confirmation modal only when modal elements exist (dedicated pages may not have them)
  function hideModal() {
    if (logoutModal) logoutModal.style.display = 'none';
  }

  if (logoutBtn && logoutModal) {
    logoutBtn.addEventListener('click', function() {
      logoutModal.style.display = 'block';
    });

    // Close modal when clicking the close button (if present)
    if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);

    // Close modal when clicking cancel button (if present)
    if (cancelLogoutBtn) cancelLogoutBtn.addEventListener('click', hideModal);

    // Logout user when clicking confirm button (if present)
    if (confirmLogoutBtn) {
      confirmLogoutBtn.addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userPreferences');
        console.log('User logged out');
        window.location.href = 'landingpage.html';
      });
    }

    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
      if (event.target === logoutModal) {
        hideModal();
      }
    });
  }
  
  // Toggle mobile menu
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
      navLinks.classList.toggle('active');
    });
  }
  
  // Handle navigation link clicks
  navLinkItems.forEach(link => {
    link.addEventListener('click', function(e) {
      // Remove active class from all links
      navLinkItems.forEach(item => item.classList.remove('active'));
      // Add active class to clicked link
      this.classList.add('active');
    });
  });
  
  // =====================================================
  // FORM HANDLERS
  // =====================================================
  
  /**
   * Handle Account Settings Form Submission
   */
  const accountForm = document.querySelector('#account .settings-form');
  if (accountForm) {
    accountForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      const fullname = document.getElementById('fullname').value.trim();
      const email = document.getElementById('email').value.trim();
      const bio = document.getElementById('bio').value.trim();
      
      // Validation
      if (!fullname) {
        showErrorMessage('Full name is required');
        return;
      }
      
      if (!validateEmail(email)) {
        showErrorMessage('Please enter a valid email address');
        return;
      }
      
      // Save to localStorage
      const user = JSON.parse(localStorage.getItem('currentUser'));
      user.name = fullname;
      user.email = email;
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // Save bio to preferences
      const preferences = JSON.parse(localStorage.getItem('userPreferences')) || {};
      preferences.bio = bio;
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      
      // Try to sync with backend
      try {
        const response = await fetch('http://localhost:3000/api/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: fullname, bio })
        });
        
        if (response.ok) {
          showSuccessMessage('Account settings saved successfully!');
        } else {
          showSuccessMessage('Changes saved locally (offline mode)');
        }
      } catch (error) {
        showSuccessMessage('Changes saved locally (offline mode)');
      }
    });
  }
  
  /**
   * Handle Password Change Form
   */
  const passwordForm = document.querySelector('.password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      const currentPassword = document.getElementById('current-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        showErrorMessage('All password fields are required');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        showErrorMessage('New passwords do not match');
        return;
      }
      
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        showErrorMessage(passwordValidation.message);
        return;
      }
      
      // Try to change password via API
      try {
        const response = await fetch('http://localhost:3000/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser.email,
            currentPassword,
            newPassword
          })
        });
        
        if (response.ok) {
          showSuccessMessage('Password changed successfully!');
          this.reset();
        } else {
          const data = await response.json();
          showErrorMessage(data.error || 'Failed to change password');
        }
      } catch (error) {
        showErrorMessage('Unable to change password (offline mode)');
      }
    });
  }
  
  /**
   * Handle Notification Settings Form
   */
  const notificationForm = document.querySelector('#notifications .form-group button');
  if (notificationForm) {
    notificationForm.addEventListener('click', function(event) {
      event.preventDefault();
      
      const checkboxes = document.querySelectorAll('#notifications input[type="checkbox"]');
      const emailNotifications = checkboxes[0].checked;
      const newsletter = checkboxes[1].checked;
      const communityUpdates = checkboxes[2].checked;
      
      // Save to localStorage
      localStorage.setItem('emailNotifications', JSON.stringify(emailNotifications));
      localStorage.setItem('newsletter', JSON.stringify(newsletter));
      localStorage.setItem('communityUpdates', JSON.stringify(communityUpdates));
      
      showSuccessMessage('Notification preferences saved!');
    });
  }
  
  /**
   * Handle Privacy Settings Form
   */
  const privacyForm = document.querySelector('#privacy .form-group button');
  if (privacyForm) {
    privacyForm.addEventListener('click', function(event) {
      event.preventDefault();
      
      const profileVisibility = document.querySelector('.privacy-select').value;
      const checkboxes = document.querySelectorAll('#privacy input[type="checkbox"]');
      const activityStatus = checkboxes[0].checked;
      const dataUsage = checkboxes[1].checked;
      
      // Save to localStorage
      localStorage.setItem('profileVisibility', profileVisibility);
      localStorage.setItem('activityStatus', JSON.stringify(activityStatus));
      localStorage.setItem('dataUsage', JSON.stringify(dataUsage));
      
      showSuccessMessage('Privacy settings saved!');
    });
  }
  
  /**
   * Handle Appearance Settings Form
   */
  const appearanceForm = document.querySelector('#appearance .form-group button');
  if (appearanceForm) {
    appearanceForm.addEventListener('click', function(event) {
      event.preventDefault();
      
      const activeTheme = document.querySelector('.theme-option.active span').textContent.toLowerCase();
      const activeFontSize = document.querySelector('.font-option.active').textContent.toLowerCase();
      
      // Already saved when selected, just show confirmation
      showSuccessMessage('Appearance settings saved!');
    });
  }
  
  // Add animations to settings elements
  document.querySelectorAll('.settings-section:not(.active)').forEach(section => {
    section.style.display = 'none';
  });
});