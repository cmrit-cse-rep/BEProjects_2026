const csv = require('csv-parser');
const { Readable } = require('stream');
const {
  mapToVitals,
  extractPatientName,
  extractPatientEmail,
  extractSymptoms,
  toNumber
} = require('../../utils/patientData');

const parseCSV = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(fileBuffer);
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        if (results.length === 0) {
          reject(new Error('No data found in CSV'));
          return;
        }

        const row = results[0];
        const vitals = mapToVitals(row);
        const patientName = extractPatientName(row);
        const patientEmail = extractPatientEmail(row);
        const symptoms = extractSymptoms(row);

        resolve({
          patientName,
          patientEmail,
          age: vitals.Age || toNumber(row.age),
          gender: vitals.Gender,
          symptoms,
          vitals
        });
      })
      .on('error', (error) => reject(error));
  });
};

module.exports = { parseCSV };

