import { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

const FileUpload = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [patientDetails, setPatientDetails] = useState({
    patientName: '',
    patientEmail: '',
    patientAge: '',
    symptoms: ''
  });
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setParsedData(null);
  };
  
  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/file/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const data = response.data.data;
      setParsedData(data);
      setPatientDetails({
        patientName: data.patientName || '',
        patientEmail: data.patientEmail || '',
        patientAge: data.age ? String(data.age) : '',
        symptoms: data.symptoms || ''
      });
      toast.success('File parsed successfully. Review details below.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setPatientDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!parsedData?.vitals) {
      toast.error('No vitals were extracted. Please use manual entry.');
      return;
    }
    if (!patientDetails.patientName.trim()) {
      toast.error('Patient name is required.');
      return;
    }
    onUpload({
      patientName: patientDetails.patientName.trim(),
      patientEmail: patientDetails.patientEmail.trim(),
      patientAge: patientDetails.patientAge ? parseInt(patientDetails.patientAge, 10) : null,
      symptoms: patientDetails.symptoms,
      vitals: parsedData.vitals,
      sourceType: 'file'
    });
  };
  
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Upload Patient File</h2>
      <p className="text-gray-600 mb-4">
        Supported formats: CSV, PDF, DOCX, TXT, Excel, JPG, PNG
      </p>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          onChange={handleFileChange}
          accept=".csv,.pdf,.docx,.txt,.xlsx,.xls,.jpg,.jpeg,.png"
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer inline-block"
        >
          <div className="text-4xl mb-2">📄</div>
          <p className="text-gray-600">
            {file ? file.name : 'Click to select file or drag and drop'}
          </p>
        </label>
      </div>
      
      {file && (
        <div className="mt-4">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary w-full"
          >
            {uploading ? 'Analyzing...' : 'Upload and Parse'}
          </button>
        </div>
      )}

      {parsedData && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Extracted Patient Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name *
              </label>
              <input
                type="text"
                name="patientName"
                value={patientDetails.patientName}
                onChange={handleDetailsChange}
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
                value={patientDetails.patientEmail}
                onChange={handleDetailsChange}
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
                value={patientDetails.patientAge}
                onChange={handleDetailsChange}
                className="input-field"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symptoms / Notes
              </label>
              <textarea
                name="symptoms"
                value={patientDetails.symptoms}
                onChange={handleDetailsChange}
                className="input-field"
                rows="3"
              />
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-2">Extracted Vitals</h4>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              {Object.entries(parsedData.vitals || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="font-medium">{key}</span>
                  <span>{Number(value).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="btn-primary w-full"
          >
            Save & Predict
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

