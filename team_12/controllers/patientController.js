const PatientRecord = require('../models/PatientRecord');
const escapeRegex = (value = '') =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Build query for patient based on id/email/name
const buildPatientQuery = (user) => {
  const clauses = [{ patientId: user._id }];
  if (user.email) {
    clauses.push({ patientEmail: user.email.toLowerCase() });
  }
  if (user.patientName || user.name) {
    clauses.push({
      patientName: { $regex: `^${escapeRegex(user.patientName || user.name)}$`, $options: 'i' }
    });
  }
  return { $or: clauses };
};

// Get patient's own records
const getMyRecords = async (req, res) => {
  try {
    const query = buildPatientQuery(req.user);
    
    const records = await PatientRecord.find(query)
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

// Get single record (patient's own)
const getMyRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const query = buildPatientQuery(req.user);
    query._id = id;
    
    const record = await PatientRecord.findOne(query)
      .populate('doctorId', 'name email');
    
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
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
      patientData,
      sepsisDetected: record.sepsisDetected,
      suggestions: record.suggestions,
      createdAt: record.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyRecords,
  getMyRecord
};

