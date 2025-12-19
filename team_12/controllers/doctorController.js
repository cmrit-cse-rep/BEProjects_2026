const fs = require('fs');
const path = require('path');
const PatientRecord = require('../models/PatientRecord');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Get all patient records (doctor view)
const getAllRecords = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10);
    let query = PatientRecord.find()
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 });

    if (!Number.isNaN(limit) && limit > 0) {
      query = query.limit(limit);
    }
    
    const records = await query;
    const sanitized = records.map((record) => {
      const data = record.toObject();
      if (data.patientData instanceof Map) {
        data.patientData = Object.fromEntries(data.patientData);
      }
      return data;
    });
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get records by patient
const getRecordsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const records = await PatientRecord.find({ patientId })
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 });
    
    const sanitized = records.map((record) => {
      const data = record.toObject();
      if (data.patientData instanceof Map) {
        data.patientData = Object.fromEntries(data.patientData);
      }
      return data;
    });
    
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all patients
const getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('name email createdAt');
    
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get activity logs
const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get statistics
const readMetrics = (filename) => {
  try {
    const metricsPath = path.join(__dirname, '../../ml/models', filename);
    if (fs.existsSync(metricsPath)) {
      const raw = fs.readFileSync(metricsPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`Unable to read metrics file ${filename}:`, err.message);
  }
  return null;
};

const getStatistics = async (req, res) => {
  try {
    const totalRecords = await PatientRecord.countDocuments();
    const sepsisDetected = await PatientRecord.countDocuments({ sepsisDetected: true });
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });

    const originalMetrics = readMetrics('original_model_metrics.json');
    const vaeMetrics = readMetrics('vae_model_metrics.json');
    
    res.json({
      totalRecords,
      sepsisDetected,
      noSepsis: totalRecords - sepsisDetected,
      totalPatients,
      totalDoctors,
      sepsisRate: totalRecords > 0 ? Number(((sepsisDetected / totalRecords) * 100).toFixed(2)) : 0,
      modelMetrics: {
        original: originalMetrics,
        vae: vaeMetrics
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllRecords,
  getRecordsByPatient,
  getAllPatients,
  getActivityLogs,
  getStatistics
};

