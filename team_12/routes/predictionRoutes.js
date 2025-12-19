const express = require('express');
const router = express.Router();
const {
  predict,
  getPrediction,
  downloadReport,
  updateSuggestions
} = require('../controllers/predictionController');
const authMiddleware = require('../middleware/authMiddleware');
const doctorOnly = require('../middleware/doctorOnly');

router.post('/predict', authMiddleware, doctorOnly, predict);
router.get('/:id', authMiddleware, getPrediction);
router.get('/:id/download', authMiddleware, downloadReport);
router.put('/:id/suggestions', authMiddleware, doctorOnly, updateSuggestions);

module.exports = router;

