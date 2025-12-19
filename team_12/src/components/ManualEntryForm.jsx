import { useState } from 'react';
import { toast } from 'react-hot-toast';

const ManualEntryForm = ({ onSubmit }) => {
  const [patientInfo, setPatientInfo] = useState({
    patientName: '',
    patientEmail: '',
    patientAge: '',
    symptoms: ''
  });

  const [vitals, setVitals] = useState({
    HR: '',
    O2Sat: '',
    Temp: '',
    SBP: '',
    DBP: '',
    MAP: '',
    Resp: '',
    WBC: '',
    Lactate: '',
    Age: '',
    Gender: '',
    ICULOS: ''
  });
  
  const handlePatientInfoChange = (e) => {
    const { name, value } = e.target;
    setPatientInfo((prev) => ({ ...prev, [name]: value }));
    if (name === 'patientAge') {
      setVitals((prev) => ({ ...prev, Age: value }));
    }
  };
  
  const handleVitalChange = (e) => {
    setVitals({ ...vitals, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!patientInfo.patientName.trim()) {
      toast.error('Patient name is required');
      return;
    }
    
    const processedVitals = {};
    Object.keys(vitals).forEach((key) => {
      if (key === 'Gender') {
        processedVitals[key] = ['male', 'm', '1'].includes(vitals[key].toString().toLowerCase()) ? 1 : 0;
      } else {
        processedVitals[key] = vitals[key] ? parseFloat(vitals[key]) : 0;
      }
    });
    
    onSubmit({
      patientName: patientInfo.patientName.trim(),
      patientEmail: patientInfo.patientEmail.trim(),
      patientAge: patientInfo.patientAge ? parseInt(patientInfo.patientAge, 10) : null,
      symptoms: patientInfo.symptoms,
      vitals: processedVitals,
      sourceType: 'manual'
    });
  };
  
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Manual Entry</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Name *
            </label>
            <input
              type="text"
              name="patientName"
              value={patientInfo.patientName}
              onChange={handlePatientInfoChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Email
            </label>
            <input
              type="email"
              name="patientEmail"
              value={patientInfo.patientEmail}
              onChange={handlePatientInfoChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Age
            </label>
            <input
              type="number"
              name="patientAge"
              value={patientInfo.patientAge}
              onChange={handlePatientInfoChange}
              className="input-field"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symptoms / Notes
            </label>
            <textarea
              name="symptoms"
              value={patientInfo.symptoms}
              onChange={handlePatientInfoChange}
              className="input-field"
              rows="3"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: 'Heart Rate (HR)', name: 'HR' },
            { label: 'Oxygen Saturation (O2Sat)', name: 'O2Sat' },
            { label: 'Temperature (Temp)', name: 'Temp', step: '0.1' },
            { label: 'Systolic BP (SBP)', name: 'SBP' },
            { label: 'Diastolic BP (DBP)', name: 'DBP' },
            { label: 'Mean Arterial Pressure (MAP)', name: 'MAP' },
            { label: 'Respiration Rate (Resp)', name: 'Resp' },
            { label: 'White Blood Cell Count (WBC)', name: 'WBC', step: '0.1' },
            { label: 'Lactate', name: 'Lactate', step: '0.1' },
            { label: 'Age (for model)', name: 'Age' },
            { label: 'Gender (Male/Female/M/F/1/0)', name: 'Gender', inputType: 'text' },
            { label: 'ICU Length of Stay (ICULOS)', name: 'ICULOS' }
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type={field.inputType || 'number'}
                step={field.step}
                name={field.name}
                value={vitals[field.name]}
                onChange={handleVitalChange}
                className="input-field"
              />
            </div>
          ))}
        </div>
        
        <button type="submit" className="btn-primary w-full">
          Submit and Predict
        </button>
      </form>
    </div>
  );
};

export default ManualEntryForm;

