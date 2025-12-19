const mammoth = require('mammoth');
const {
  mapToVitals,
  extractPatientName,
  extractPatientEmail,
  extractSymptoms
} = require('../../utils/patientData');

const parseDOCX = async (fileBuffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const text = result.value || '';
    
    const extractedData = {};
    
    const patterns = {
      HR: /(?:heart\s*rate|HR)[\s:]*([\d.]+)/i,
      Temp: /(?:temperature|temp)[\s:]*([\d.]+)/i,
      O2Sat: /(?:oxygen\s*saturation|O2\s*Sat|SpO2)[\s:]*([\d.]+)/i,
      SBP: /(?:systolic\s*BP|SBP)[\s:]*([\d.]+)/i,
      DBP: /(?:diastolic\s*BP|DBP)[\s:]*([\d.]+)/i,
      MAP: /(?:mean\s*arterial\s*pressure|MAP)[\s:]*([\d.]+)/i,
      Resp: /(?:respiration|resp\s*rate)[\s:]*([\d.]+)/i,
      WBC: /(?:white\s*blood\s*cell|WBC)[\s:]*([\d.]+)/i,
      Lactate: /(?:lactate)[\s:]*([\d.]+)/i,
      Age: /(?:age)[\s:]*([\d.]+)/i,
      Gender: /(?:gender|sex)[\s:]*([a-zA-Z]+)/i
    };
    
    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match && match[1]) {
        extractedData[key] = match[1].trim();
      }
    });

    const nameMatch = text.match(/(?:patient\s*name|name)[\s:]*([A-Za-z\s]+)/i);
    if (nameMatch && nameMatch[1]) {
      extractedData.patientName = nameMatch[1].trim();
    }

    const symptomsMatch = text.match(/(?:symptoms|complaints|notes)[\s:]*([A-Za-z,\s]+)/i);
    if (symptomsMatch && symptomsMatch[1]) {
      extractedData.symptoms = symptomsMatch[1].trim();
    }

    const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (emailMatch && emailMatch[0]) {
      extractedData.patientEmail = emailMatch[0].toLowerCase();
    }
    
    const vitals = mapToVitals(extractedData);
    const patientName = extractPatientName(extractedData);
    const patientEmail = extractPatientEmail(extractedData);
    const symptoms = extractSymptoms(extractedData);

    return {
      patientName,
      patientEmail,
      age: vitals.Age,
      gender: vitals.Gender,
      symptoms,
      vitals
    };
  } catch (error) {
    throw new Error(`DOCX parsing error: ${error.message}`);
  }
};

module.exports = { parseDOCX };

