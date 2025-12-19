const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies && req.cookies.token;

    const handleUnauth = () => {
      // Prefer JSON for any API route to make client fetch/XHR handling deterministic
      const isApiPath = req.originalUrl && req.originalUrl.startsWith('/api/');
      if (isApiPath) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Fallback: respect XHR / Accept header for non-API routes
      const acceptsJson = req.xhr || (req.get && /application\/json/.test(req.get('accept'))) || (req.headers['accept'] && req.headers['accept'].includes('application/json'));
      if (acceptsJson) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      return res.redirect('/users/login');
    };

    if (!token) {
      return handleUnauth();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET); // Use the same secret used while signing
    } catch (e) {
      console.error('JWT verify failed:', e);
      return handleUnauth();
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return handleUnauth();
    }

    req.user = user; // Attach user data to request
    next();
  } catch (err) {
    console.error('Auth Error:', err);
    // Fallback - prefer JSON for API endpoints
    if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.redirect('/users/login');
  }
};

module.exports = isLoggedIn;
