const patientOnly = (req, res, next) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ message: 'Access denied. Patient role required.' });
  }
  next();
};

module.exports = patientOnly;








