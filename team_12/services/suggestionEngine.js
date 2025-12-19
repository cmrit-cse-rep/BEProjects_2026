const generateSuggestions = (predictionResult, patientData = {}, symptoms = '') => {
  const suggestions = new Set();
  const { sepsis_detected } = predictionResult;

  const hr = patientData.HR || 0;
  const temp = patientData.Temp || 0;
  const o2 = patientData.O2Sat || 0;
  const wbc = patientData.WBC || 0;
  const lactate = patientData.Lactate || 0;
  const map = patientData.MAP || 0;

  if (sepsis_detected) {
    suggestions.add('High risk of sepsis detected. Admit patient for continuous monitoring.');
    suggestions.add('Start broad-spectrum antibiotics within the first hour where clinically appropriate.');
    suggestions.add('Initiate aggressive fluid resuscitation if mean arterial pressure is low.');
    suggestions.add('Draw blood cultures and identify infection source immediately.');
  } else {
    suggestions.add('No sepsis detected currently. Continue standard observation.');
    suggestions.add('Educate patient on early warning symptoms and escalate if condition worsens.');
  }

  if (hr > 100) {
    suggestions.add('Persistent tachycardia noted. Evaluate for pain, hypovolemia, or infection.');
  }

  if (temp >= 38.5) {
    suggestions.add('Fever present. Consider antipyretics and investigate infection focus.');
  } else if (temp < 36) {
    suggestions.add('Hypothermia detected. Provide external warming and evaluate hemodynamics.');
  }

  if (o2 < 92) {
    suggestions.add('Low oxygen saturation. Provide supplemental oxygen or consider ventilatory support.');
  }

  if (map < 65) {
    suggestions.add('Mean arterial pressure is low. Consider vasopressors after adequate fluids.');
  }

  if (wbc > 12 || wbc < 4) {
    suggestions.add('Abnormal WBC count. Monitor infection markers and inflammatory response.');
  }

  if (lactate >= 2) {
    suggestions.add('Elevated lactate suggests tissue hypoperfusion. Repeat within 2 hours and manage aggressively.');
  }

  if (symptoms && symptoms.toLowerCase().includes('shortness')) {
    suggestions.add('Monitor respiratory status closely; consider ABG if dyspnea worsens.');
  }

  suggestions.add('Maintain strict fluid balance chart and monitor urine output hourly.');
  suggestions.add('Provide broad nutritional support and encourage oral intake if tolerated.');
  suggestions.add('Schedule follow-up labs (CBC, lactate, metabolic panel) within 6 hours.');

  return Array.from(suggestions);
};

module.exports = { generateSuggestions };

