const doctorOnly = (req, res, next) => {
  if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Doctor role required.' });
  }
  next();
};

module.exports = doctorOnly;








