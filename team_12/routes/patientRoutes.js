const express = require('express');
const router = express.Router();
const {
  getMyRecords,
  getMyRecord
} = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');
const patientOnly = require('../middleware/patientOnly');

router.use(authMiddleware);
router.use(patientOnly);

router.get('/records', getMyRecords);
router.get('/records/:id', getMyRecord);

module.exports = router;


