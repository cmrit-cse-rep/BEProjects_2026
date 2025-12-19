const PatientRecord = require('../models/PatientRecord');
const DoctorsRecord = require('../models/DoctorsRecord');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { predictSepsis } = require('../services/pythonService');
const { generateSuggestions } = require('../services/suggestionEngine');
const { generateDoctorReport, generatePatientReport } = require('../services/pdfGenerator');
const { mapToVitals } = require('../utils/patientData');
const path = require('path');
const fs = require('fs');

const canPatientAccessRecord = (record, user) => {
  if (!record || !user) return false;
  if (record.patientId && record.patientId.toString() === user._id.toString()) {
    return true;
  }
  if (record.patientEmail && record.patientEmail.toLowerCase() === user.email.toLowerCase()) {
    return true;
  }
  if (record.patientName && user.patientName && record.patientName.toLowerCase() === user.patientName.toLowerCase()) {
    return true;
  }
  if (record.patientName && record.patientName.toLowerCase() === user.name.toLowerCase()) {
    return true;
  }
  return false;
};

// Predict sepsis
const predict = async (req, res) => {
  try {
    const {
      patientName,
      patientEmail,
      patientAge,
      symptoms,
      vitals,
      sourceType = 'manual'
    } = req.body;

    if (!patientName) {
      return res.status(400).json({ message: 'Patient name is required for prediction' });
    }
    const normalizedPatientName = patientName.trim();

    const userId = req.user._id;
    const doctorEmail = req.user.email;
    const normalizedPatientEmail = patientEmail ? patientEmail.toLowerCase() : null;
    
    const numericPatientAge = patientAge === undefined || patientAge === null || patientAge === ''
      ? null
      : Number(patientAge);

    const formattedVitals = mapToVitals(vitals || req.body);
    if (!formattedVitals || Object.keys(formattedVitals).length === 0) {
      return res.status(400).json({ message: 'Unable to detect patient vitals. Please provide the measurements manually.' });
    }
    const vitalsMap = new Map(Object.entries(formattedVitals));
    
    // Predict using Python service
    const predictionResult = await predictSepsis(formattedVitals);
    
    // Generate suggestions
    const suggestions = generateSuggestions(predictionResult, formattedVitals, symptoms);

    // Link to patient user if they exist
    let linkedPatientId = null;
    if (normalizedPatientEmail) {
      const patientUser = await User.findOne({ email: normalizedPatientEmail });
      if (patientUser) {
        linkedPatientId = patientUser._id;
      }
    }
    
    // Create patient record
    const record = await PatientRecord.create({
      patientId: linkedPatientId,
      doctorId: userId,
      patientName: normalizedPatientName,
      patientEmail: normalizedPatientEmail,
      doctorEmail,
      patientAge: numericPatientAge ?? formattedVitals.Age ?? null,
      symptoms: symptoms || 'Not provided',
      sourceType,
      patientData: vitalsMap,
      originalModelPrediction: predictionResult.original_model,
      vaeModelPrediction: predictionResult.vae_model,
      sepsisDetected: predictionResult.sepsis_detected,
      suggestions
    });

    try {
      await DoctorsRecord.create({
        patientName: normalizedPatientName,
        patientEmail: normalizedPatientEmail,
        doctorEmail,
        age: numericPatientAge ?? formattedVitals.Age ?? null,
        symptoms: symptoms || 'Not provided',
        vitals: new Map(vitalsMap),
        predictionResults: {
          originalModel: predictionResult.original_model,
          vaeModel: predictionResult.vae_model
        },
        predictionSummary: predictionResult.sepsis_detected ? 'Sepsis detected' : 'No sepsis detected',
        uploadedBy: userId,
        result: predictionResult.sepsis_detected ? 'sepsis' : 'normal'
      });
    } catch (logError) {
      console.warn('DoctorsRecord logging failed:', logError.message);
    }
    
    // Log activity
    try {
      await ActivityLog.create({
        userId,
        action: 'prediction_made',
        details: {
          recordId: record._id,
          sepsisDetected: predictionResult.sepsis_detected,
          patientName: normalizedPatientName
        }
      });
    } catch (logError) {
      console.warn('ActivityLog logging failed:', logError.message);
    }
    
    res.json({
      success: true,
      record: {
        id: record._id,
        patientName: record.patientName,
        patientEmail: record.patientEmail,
        patientAge: record.patientAge,
        symptoms: record.symptoms,
        sepsisDetected: predictionResult.sepsis_detected,
        originalModel: predictionResult.original_model,
        vaeModel: predictionResult.vae_model,
        metrics: {
          original: predictionResult.original_model?.metrics,
          vae: predictionResult.vae_model?.metrics
        },
        vitals: formattedVitals,
        suggestions,
        createdAt: record.createdAt
      }
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get prediction by ID
const getPrediction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;
    
    const record = await PatientRecord.findById(id)
      .populate('doctorId', 'name email');
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    // Access control
    if (userRole === 'patient' && !canPatientAccessRecord(record, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Convert Map to object
    const patientData = {};
    if (record.patientData instanceof Map) {
      record.patientData.forEach((value, key) => {
        patientData[key] = value;
      });
    } else if (typeof record.patientData === 'object') {
      Object.assign(patientData, record.patientData);
    }
    
    res.json({
      id: record._id,
      patientName: record.patientName,
      patientEmail: record.patientEmail,
      patientAge: record.patientAge,
      symptoms: record.symptoms,
      doctor: record.doctorId,
      patientData,
      originalModel: record.originalModelPrediction,
      vaeModel: record.vaeModelPrediction,
      sepsisDetected: record.sepsisDetected,
      suggestions: record.suggestions,
      createdAt: record.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate and download report
const downloadReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;
    
    const record = await PatientRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    // Access control
    if (userRole === 'patient' && !canPatientAccessRecord(record, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Convert Map to object
    const patientData = {};
    if (record.patientData instanceof Map) {
      record.patientData.forEach((value, key) => {
        patientData[key] = value;
      });
    } else if (typeof record.patientData === 'object') {
      Object.assign(patientData, record.patientData);
    }
    record.patientData = patientData;
    
    // Generate report
    const reportsDir = path.join(__dirname, '../reports/pdfs');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportFilename = `report_${id}_${Date.now()}.pdf`;
    const reportPath = path.join(reportsDir, reportFilename);
    
    if (userRole === 'doctor') {
      await generateDoctorReport(record, reportPath);
    } else {
      await generatePatientReport(record, reportPath);
    }
    
    // Update record with report path
    record.reportPath = reportPath;
    await record.save();
    
    // Log activity
    await ActivityLog.create({
      userId,
      action: 'report_downloaded',
      details: { recordId: id, reportPath }
    });
    
    // Send file
    res.download(reportPath, reportFilename, (err) => {
      if (err) {
        console.error('Error downloading report:', err);
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update suggestions
const updateSuggestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { suggestions } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;
    
    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can update suggestions' });
    }
    
    const record = await PatientRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    record.suggestions = suggestions;
    await record.save();
    
    // Log activity
    await ActivityLog.create({
      userId,
      action: 'suggestions_updated',
      details: { recordId: id }
    });
    
    res.json({ message: 'Suggestions updated successfully', record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  predict,
  getPrediction,
  downloadReport,
  updateSuggestions
};

