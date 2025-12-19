const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}

const requireAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts[0] !== 'Bearer' || !parts[1]) {
      return res.status(401).json({ success: false, error: 'Missing Bearer token' });
    }
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('portfolio');
    res.json({ success: true, portfolio: user?.portfolio || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { id, symbol, quantity, buyPrice, buyDate, currentPrice } = req.body;
    if (!symbol || !quantity || !buyPrice) {
      return res.status(400).json({ success: false, error: 'symbol, quantity, and buyPrice are required' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (id) {
      const item = user.portfolio.id(id);
      if (!item) return res.status(404).json({ success: false, error: 'Portfolio item not found' });
      item.symbol = symbol.toUpperCase();
      item.quantity = quantity;
      item.buyPrice = buyPrice;
      item.buyDate = buyDate || item.buyDate;
      item.currentPrice = currentPrice ?? item.currentPrice;
      user.portfolioHistory.push({ action: 'update', symbol: item.symbol, quantity: item.quantity, buyPrice: item.buyPrice, buyDate: item.buyDate, currentPrice: item.currentPrice });
    } else {
      user.portfolio.push({ symbol: symbol.toUpperCase(), quantity, buyPrice, buyDate, currentPrice });
      user.portfolioHistory.push({ action: 'create', symbol: symbol.toUpperCase(), quantity, buyPrice, buyDate, currentPrice });
    }

    await user.save();
    res.json({ success: true, portfolio: user.portfolio });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const before = user.portfolio.length;
    const removed = user.portfolio.find(p => String(p._id) === String(req.params.id));
    user.portfolio = user.portfolio.filter(p => String(p._id) !== String(req.params.id));
    if (user.portfolio.length === before) {
      return res.status(404).json({ success: false, error: 'Portfolio item not found' });
    }
    if (removed) {
      user.portfolioHistory.push({ action: 'delete', symbol: removed.symbol, quantity: removed.quantity, buyPrice: removed.buyPrice, buyDate: removed.buyDate, currentPrice: removed.currentPrice });
    }
    await user.save();
    res.json({ success: true, portfolio: user.portfolio });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/history', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('portfolioHistory');
    res.json({ success: true, history: user?.portfolioHistory || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;