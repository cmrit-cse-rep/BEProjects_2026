const express = require('express');
const router = express.Router();
const { upload, uploadAndParse } = require('../controllers/fileUploadController');
const authMiddleware = require('../middleware/authMiddleware');
const doctorOnly = require('../middleware/doctorOnly');

router.post('/upload', authMiddleware, doctorOnly, upload.single('file'), uploadAndParse);

module.exports = router;

