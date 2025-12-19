const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseCSV } = require('../services/fileParser/csvParser');
const { parsePDF } = require('../services/fileParser/pdfParser');
const { parseDOCX } = require('../services/fileParser/docParser');
const { parseImage } = require('../services/fileParser/imageOCR');
const { parseTXT } = require('../services/fileParser/txtParser');
const { parseExcel } = require('../services/fileParser/excelParser');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|docx|csv|txt|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype.toLowerCase());
    
    if (mimetype || extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Allowed: CSV, PDF, DOCX, TXT, Excel, and images.'));
  }
});

// Upload and parse file
const uploadAndParse = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const file = req.file;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    let extractedData = {};
    
    try {
      // Parse based on file type
      if (fileExtension === '.csv') {
        extractedData = await parseCSV(file.buffer);
      } else if (fileExtension === '.pdf') {
        extractedData = await parsePDF(file.buffer);
      } else if (fileExtension === '.docx') {
        extractedData = await parseDOCX(file.buffer);
      } else if (fileExtension === '.txt') {
        extractedData = await parseTXT(file.buffer);
      } else if (['.xlsx', '.xls'].includes(fileExtension)) {
        extractedData = await parseExcel(file.buffer);
      } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
        extractedData = await parseImage(file.buffer);
      } else {
        return res.status(400).json({ message: 'Unsupported file type' });
      }

      if (!extractedData || !extractedData.vitals) {
        return res.status(422).json({ message: 'No vitals detected in the file. Please enter manually.' });
      }
      
      res.json({
        success: true,
        data: extractedData,
        message: 'File parsed successfully'
      });
    } catch (parseError) {
      res.status(400).json({
        message: 'Error parsing file',
        error: parseError.message
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  upload,
  uploadAndParse
};

