const FEATURE_COLUMNS = [
  'HR', 'O2Sat', 'Temp', 'SBP', 'DBP', 'MAP', 'Resp', 'EtCO2',
  'BaseExcess', 'HCO3', 'FiO2', 'pH', 'PaCO2', 'SaO2', 'AST', 'BUN',
  'Alkalinephos', 'Calcium', 'Chloride', 'Creatinine', 'Bilirubin_direct',
  'Glucose', 'Lactate', 'Magnesium', 'Phosphate', 'Potassium',
  'Bilirubin_total', 'TroponinI', 'Hct', 'Hgb', 'PTT', 'WBC',
  'Fibrinogen', 'Platelets', 'Age', 'Gender', 'ICULOS'
];

const FEATURE_ALIASES = {
  HR: ['hr', 'heart_rate', 'heart rate', 'pulse'],
  O2Sat: ['o2sat', 'oxygen_saturation', 'oxygen saturation', 'spo2'],
  Temp: ['temp', 'temperature', 'body_temp'],
  SBP: ['sbp', 'systolic_bp', 'systolic blood pressure'],
  DBP: ['dbp', 'diastolic_bp', 'diastolic blood pressure'],
  MAP: ['map', 'mean_arterial_pressure'],
  Resp: ['resp', 'respiration_rate', 'resp rate'],
  EtCO2: ['etco2'],
  BaseExcess: ['baseexcess', 'base_excess'],
  HCO3: ['hco3', 'bicarbonate'],
  FiO2: ['fio2'],
  pH: ['ph'],
  PaCO2: ['paco2'],
  SaO2: ['sao2'],
  AST: ['ast'],
  BUN: ['bun'],
  Alkalinephos: ['alkalinephos', 'alkaline_phosphatase'],
  Calcium: ['calcium'],
  Chloride: ['chloride'],
  Creatinine: ['creatinine'],
  Bilirubin_direct: ['bilirubin_direct', 'direct_bilirubin'],
  Glucose: ['glucose', 'blood_sugar'],
  Lactate: ['lactate'],
  Magnesium: ['magnesium'],
  Phosphate: ['phosphate'],
  Potassium: ['potassium', 'k'],
  Bilirubin_total: ['bilirubin_total', 'total_bilirubin'],
  TroponinI: ['troponini', 'troponin'],
  Hct: ['hct', 'hematocrit'],
  Hgb: ['hgb', 'hemoglobin'],
  PTT: ['ptt'],
  WBC: ['wbc', 'white_blood_cell', 'white blood cell'],
  Fibrinogen: ['fibrinogen'],
  Platelets: ['platelets', 'plt'],
  Age: ['age'],
  Gender: ['gender', 'sex'],
  ICULOS: ['iculos', 'icu_los', 'icu_lengh_of_stay']
};

const PATIENT_NAME_KEYS = ['patientname', 'patient_name', 'name', 'patient'];
const PATIENT_EMAIL_KEYS = ['patientemail', 'patient_email', 'email'];
const PATIENT_SYMPTOM_KEYS = ['symptoms', 'chief_complaint', 'notes'];

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.+-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeGender = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).toLowerCase();
  if (['male', 'm', '1'].includes(normalized)) return 1;
  if (['female', 'f', '0'].includes(normalized)) return 0;
  return null;
};

const buildLookup = (data = {}) => {
  const lookup = {};
  Object.entries(data).forEach(([key, value]) => {
    if (!key) return;
    lookup[String(key).toLowerCase()] = value;
  });
  return lookup;
};

const getValueByAliases = (lookup, aliases = []) => {
  for (const alias of aliases) {
    const lower = alias.toLowerCase();
    if (lookup.hasOwnProperty(lower)) {
      return lookup[lower];
    }
  }
  return null;
};

const mapToVitals = (data = {}) => {
  const lookup = buildLookup(data);
  const vitals = {};

  FEATURE_COLUMNS.forEach((feature) => {
    const aliases = FEATURE_ALIASES[feature] || [feature.toLowerCase()];
    let value = getValueByAliases(lookup, aliases);

    if (feature === 'Gender') {
      const normalized = normalizeGender(value);
      vitals[feature] = normalized !== null ? normalized : 0;
      return;
    }

    const numericValue = toNumber(value);
    vitals[feature] = numericValue !== null ? numericValue : 0;
  });

  return vitals;
};

const extractPatientName = (data = {}) => {
  const lookup = buildLookup(data);
  for (const key of PATIENT_NAME_KEYS) {
    if (lookup[key]) {
      return String(lookup[key]).trim();
    }
  }
  return null;
};

const extractPatientEmail = (data = {}) => {
  const lookup = buildLookup(data);
  for (const key of PATIENT_EMAIL_KEYS) {
    if (lookup[key]) {
      return String(lookup[key]).trim().toLowerCase();
    }
  }
  const emailMatch = JSON.stringify(data).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return emailMatch ? emailMatch[0].toLowerCase() : null;
};

const extractSymptoms = (data = {}) => {
  const lookup = buildLookup(data);
  for (const key of PATIENT_SYMPTOM_KEYS) {
    if (lookup[key]) {
      return String(lookup[key]).trim();
    }
  }
  return null;
};

module.exports = {
  FEATURE_COLUMNS,
  mapToVitals,
  extractPatientName,
  extractPatientEmail,
  extractSymptoms,
  toNumber,
  normalizeGender,
};



