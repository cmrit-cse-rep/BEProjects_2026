const router = require('express').Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}

const signToken = (user) => {
  return jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });

router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'username, email, and password are required' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ success: false, error: 'User already exists' });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = signToken(user);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username
    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'identifier and password are required' });
    }

    const query = identifier.includes('@') ? { email: identifier.toLowerCase() } : { username: identifier };
    const user = await User.findOne(query);
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ success: true, token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts[0] !== 'Bearer' || !parts[1]) {
      return res.status(401).json({ success: false, error: 'Missing Bearer token' });
    }

    const payload = jwt.verify(parts[1], JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

module.exports = router;