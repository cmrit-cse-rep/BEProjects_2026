const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Import the existing User model
const { generateToken } = require('../utils/generatetoken');
const verifyToken = require('../middleware/auth');

const router = express.Router();
const isLoggedIn = require('../middleware/isLoggedIn');




// Show register page
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// Handle register form
router.post('/register', async (req, res) => {
  console.log(req.body); // For debugging

  try {
    const { email, password, fullname, subjects } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', { error: 'Account already exists.' });
    }

    let selectedSubjects = subjects;
    if (!selectedSubjects) {
      return res.render('register', { error: 'Please select at least one subject.' });
    }
    if (!Array.isArray(selectedSubjects)) {
      selectedSubjects = [selectedSubjects];
    }
    if (selectedSubjects.length < 1) {
      return res.render('register', { error: 'Please select at least one subject.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hash,
      fullname,
      subjects: selectedSubjects,
    });

    const token = generateToken(user);

    res.cookie('token', token);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Registration Error:', err);
    res.render('register', { error: 'Something went wrong. Try again.' });
  }
});



// Show login page
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Handle login form
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.render('login', { error: 'Invalid email or password' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.render('login', { error: 'Invalid email or password' });
  }

  const token = generateToken(user);
  res.cookie('token', token);
  res.redirect('/dashboard');
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});
router.post('/interest', isLoggedIn, async (req, res) => {
  const { subject } = req.body;
  if (!subject) return res.status(400).json({ error: 'Subject required' });

  try {
    const user = await User.findById(req.user._id);

    let interests = user.interests;
    if (!(interests instanceof Map)) {
      interests = new Map(Object.entries(interests || {}));
    }

    const currentCount = interests.get(subject) || 0;
    interests.set(subject, currentCount + 1);

    user.interests = interests;
    await user.save();

    res.json({ success: true, interests: Object.fromEntries(interests) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});






module.exports = router;
