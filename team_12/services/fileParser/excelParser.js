const xlsx = require('xlsx');
const {
  mapToVitals,
  extractPatientName,
  extractPatientEmail,
  extractSymptoms,
  toNumber
} = require('../../utils/patientData');

const parseExcel = async (fileBuffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const json = xlsx.utils.sheet_to_json(worksheet);

  if (!json.length) {
    throw new Error('No data found in Excel file');
  }

  const row = json[0];
  const vitals = mapToVitals(row);
  const patientName = extractPatientName(row);
  const patientEmail = extractPatientEmail(row);
  const symptoms = extractSymptoms(row);

  return {
    patientName,
    patientEmail,
    age: vitals.Age || toNumber(row.age),
    gender: vitals.Gender,
    symptoms,
    vitals
  };
};

module.exports = { parseExcel };



