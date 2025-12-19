const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const DoctorsRecord = require('../models/DoctorsRecord');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const escapeRegex = (value = '') =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const role = normalizedEmail.endsWith('@cmrit.ac.in') ? 'doctor' : 'patient';

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      name,
      email: normalizedEmail,
      password,
      role,
      patientName: role === 'patient' ? name : null
    });

    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: 'register',
      details: { email: normalizedEmail, role }
    });

    res.status(201).json({
      message: 'Registration successful! Please login now.',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = (email || '').toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Patient login restriction based on DoctorsRecord
    if (user.role === 'patient') {
      const targetName = user.patientName || user.name;
      const searchQuery = {
        $or: [
          { patientEmail: user.email },
          { patientName: { $regex: `^${escapeRegex(targetName)}$`, $options: 'i' } }
        ]
      };

      const exists = await DoctorsRecord.findOne(searchQuery);
      if (!exists) {
        return res.status(401).json({
          message: 'No doctor record found for this patient. Contact hospital.'
        });
      }
    }

    const token = generateToken(user._id);

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: 'login',
      details: { email: normalizedEmail },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
};

