const express = require('express');
const router = express.Router();
const {
  getAllRecords,
  getRecordsByPatient,
  getAllPatients,
  getActivityLogs,
  getStatistics
} = require('../controllers/doctorController');
const authMiddleware = require('../middleware/authMiddleware');
const doctorOnly = require('../middleware/doctorOnly');

router.use(authMiddleware);
router.use(doctorOnly);

router.get('/records', getAllRecords);
router.get('/records/patient/:patientId', getRecordsByPatient);
router.get('/patients', getAllPatients);
router.get('/logs', getActivityLogs);
router.get('/statistics', getStatistics);

module.exports = router;


