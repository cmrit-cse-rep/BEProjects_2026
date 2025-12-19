const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      fullname: user.fullname
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
}

module.exports = { generateToken };
