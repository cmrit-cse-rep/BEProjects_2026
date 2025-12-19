# 🔧 Settings Functionality Documentation

## File Locations

### Main Files:
1. **`public/settings.html`** - Settings page HTML structure
2. **`public/setting.js`** - Settings functionality (JavaScript)
3. **`public/settings.css`** - Settings page styling

---

## 📁 File Structure

### `settings.html` (275 lines)
The HTML markup that defines the settings interface with 4 main sections:

**Navigation Bar:**
- Links to Home, Articles, About, Resources, Community, Settings
- Mobile menu toggle button
- Logo/branding

**Header:**
- Settings title
- User profile display (avatar, name, email)

**Settings Sections (4 tabs):**

#### 1. **Account Settings** (`id="account"`)
- Full name input
- Email input  
- Bio/description textarea
- Save changes button
- Password change form
  - Current password
  - New password
  - Confirm password
  - Update password button
- Session management
  - Logout button
- Danger zone
  - Delete account button

#### 2. **Notification Settings** (`id="notifications"`)
- Email Notifications toggle
- Newsletter subscription toggle
- Community Updates toggle
- Save preferences button

#### 3. **Privacy Settings** (`id="privacy"`)
- Profile Visibility dropdown (Public, Members Only, Private)
- Activity Status toggle
- Data Usage toggle
- Save privacy settings button

#### 4. **Appearance Settings** (`id="appearance"`)
- Theme selection (Light, Dark, System)
- Font size selection (Small, Medium, Large)
- Save appearance button

---

## 🎯 JavaScript Functionality (`setting.js`)

### Event Listeners & Functions:

#### 1. **Menu Item Click Handler** (Line 17-31)
```javascript
menuItems.forEach(item => {
  item.addEventListener('click', function() {
    // Toggle active class on menu items
    // Show/hide corresponding settings section
    // Data attribute: data-section (account, notifications, privacy, appearance)
  });
});
```
**Purpose**: Switch between settings sections when menu items are clicked

---

#### 2. **Theme Selection** (Line 33-42)
```javascript
themeOptions.forEach(option => {
  option.addEventListener('click', function() {
    // Remove active class from all theme options
    // Add active class to clicked option
  });
});
```
**Purpose**: Handle theme selection (Light/Dark/System)

---

#### 3. **Font Size Selection** (Line 44-53)
```javascript
fontOptions.forEach(option => {
  option.addEventListener('click', function() {
    // Remove active class from all font options
    // Add active class to clicked option
  });
});
```
**Purpose**: Handle font size selection (Small/Medium/Large)

---

#### 4. **Logout Modal** (Line 55-79)
```javascript
// Show modal on logout button click
logoutBtn.addEventListener('click', function() {
  logoutModal.style.display = 'block';
});

// Hide modal functions
function hideModal() {
  logoutModal.style.display = 'none';
}

// Confirm logout
confirmLogoutBtn.addEventListener('click', function() {
  console.log('User logged out');
  window.location.href = 'index.html'; // Redirect
});
```
**Purpose**: 
- Display confirmation before logout
- Handle logout action
- Redirect to home page

---

#### 5. **Mobile Menu Toggle** (Line 81-87)
```javascript
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', function() {
    navLinks.classList.toggle('active');
  });
}
```
**Purpose**: Toggle mobile navigation menu

---

#### 6. **Form Submission Handler** (Line 97-118)
```javascript
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    // Show success message
    // Remove message after 3 seconds
  });
});
```
**Purpose**: 
- Prevent default form submission
- Show "Changes saved successfully!" message
- Auto-remove message after 3 seconds

---

#### 7. **Navigation Link Handler** (Line 89-95)
```javascript
navLinkItems.forEach(link => {
  link.addEventListener('click', function(e) {
    // Remove active class from all links
    // Add active class to clicked link
  });
});
```
**Purpose**: Highlight active navigation link

---

#### 8. **DOM Initialization** (Line 128-130)
```javascript
document.querySelectorAll('.settings-section:not(.active)').forEach(section => {
  section.style.display = 'none';
});
```
**Purpose**: Hide non-active settings sections on page load

---

## 📋 HTML Elements Reference

### CSS Classes Used:
- `.settings-container` - Main settings wrapper
- `.settings-sidebar` - Left sidebar menu
- `.menu-item` - Individual menu items
- `.active` - Applied to active menu items and sections
- `.settings-section` - Each settings tab content
- `.settings-form` - Form wrapper
- `.form-group` - Form input wrapper
- `.toggle` - Toggle switch
- `.theme-option` - Theme selection button
- `.font-option` - Font size button

### Data Attributes:
- `data-section="account"` - Links menu item to section
- `data-section="notifications"`
- `data-section="privacy"`
- `data-section="appearance"`

---

## 🔌 Button & Form IDs

| ID | Element | Function |
|---|---------|----------|
| `logout-btn` | Button | Trigger logout modal |
| `confirm-logout` | Button | Confirm logout action |
| `cancel-logout` | Button | Cancel logout |
| `logout-modal` | Modal | Logout confirmation dialog |
| `fullname` | Input | User's full name |
| `email` | Input | User's email |
| `bio` | Textarea | User biography |
| `current-password` | Input | Current password for change |
| `new-password` | Input | New password |
| `confirm-password` | Input | Password confirmation |

---

## ✨ Current Features

### ✅ Implemented:
- Section switching (4 tabs)
- Theme selection UI
- Font size selection UI
- Logout confirmation modal
- Form submission (with success message)
- Mobile menu toggle
- Navigation highlighting

### ⏳ Not Yet Implemented (Backend):
- Actual password change (API endpoint)
- Account deletion
- Email/profile updates to database
- Notification preferences saving
- Privacy settings saving
- Theme persistence to database
- Font size persistence to database

---

## 🚀 To Complete the Settings Feature

### 1. **Add Backend API Endpoints** (`server.js`)

```javascript
// Update user profile
app.post('/api/update-profile', async (req, res) => {
  const { email, name, bio } = req.body;
  // Update user in database
});

// Change password
app.post('/api/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  // Verify current password with bcrypt
  // Hash new password
  // Update in database
});

// Update notification preferences
app.post('/api/preferences/notifications', async (req, res) => {
  const { email, preferences } = req.body;
  // Save to database
});

// Update privacy settings
app.post('/api/preferences/privacy', async (req, res) => {
  const { email, preferences } = req.body;
  // Save to database
});

// Delete account
app.delete('/api/delete-account', async (req, res) => {
  const { email } = req.body;
  // Delete user and all data
});
```

### 2. **Enhance JavaScript** (`setting.js`)

```javascript
// Make API calls instead of just showing success message
form.addEventListener('submit', async function(event) {
  event.preventDefault();
  
  const formData = new FormData(this);
  const data = Object.fromEntries(formData);
  
  const response = await fetch('/api/update-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (response.ok) {
    // Show success message
  } else {
    // Show error message
  }
});
```

### 3. **Add Session Validation**

```javascript
// Check if user is logged in
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser || !currentUser.email) {
  window.location.href = 'landingpage.html';
}
```

---

## 📊 User Profile Object (localStorage)

```javascript
{
  name: "Jane Doe",
  email: "jane@example.com",
  quizCompleted: true,
  quizScore: 25,
  preferences: {
    notificationFrequency: "weekly",
    therapyPreference: "cbt",
    activityReminders: true
  },
  moodEntries: [...]
}
```

---

## 🎨 Styling (`settings.css`)

The CSS file handles:
- Layout (sidebar + content)
- Color scheme (gradients, backgrounds)
- Responsive design (mobile breakpoints)
- Animations (fade-in, transitions)
- Theme previews (light/dark mode colors)
- Toggle switches
- Form styling
- Modal styling

---

## 🔐 Security Notes

### Current Issues:
- No password validation
- No email verification
- No CSRF protection
- Account deletion not protected

### Recommended Fixes:
- Validate password strength (min 8 chars, uppercase, number)
- Send verification email before allowing changes
- Add CSRF tokens to forms
- Require password confirmation for account deletion
- Use secure sessions (JWT or express-session)

---

## 📱 Responsive Design

The settings page is responsive with:
- Mobile-friendly sidebar
- Hamburger menu on small screens
- Stacked layout on mobile
- Touch-friendly buttons
- Proper spacing and margins

---

## 🧪 Testing the Settings

1. **Manual Testing:**
   ```
   1. Open: http://localhost:3000/public/settings.html
   2. Click menu items to switch sections
   3. Select theme options
   4. Select font sizes
   5. Click logout button
   6. Submit a form
   ```

2. **Console Testing:**
   ```javascript
   // Simulate menu click
   document.querySelector('[data-section="notifications"]').click();
   
   // Simulate theme selection
   document.querySelector('.theme-option:nth-child(2)').click();
   
   // Simulate logout
   document.getElementById('logout-btn').click();
   ```

---

## 📝 Summary

| Aspect | Status | Location |
|--------|--------|----------|
| **HTML Structure** | ✅ Complete | `settings.html` |
| **JavaScript Logic** | ✅ Complete | `setting.js` |
| **Styling** | ✅ Complete | `settings.css` |
| **API Integration** | ⏳ Pending | Need `server.js` updates |
| **Database Persistence** | ⏳ Pending | Need MongoDB schema updates |
| **Password Hashing** | ✅ Available | bcryptjs ready |
| **Session Management** | ⏳ Partial | Needs JWT/session setup |

---

**All UI functionality is ready; backend integration needed for data persistence!** 🎉
