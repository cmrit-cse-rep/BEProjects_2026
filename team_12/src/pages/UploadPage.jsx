import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import FileUpload from '../components/FileUpload';
import ManualEntryForm from '../components/ManualEntryForm';

const UploadPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('file'); // 'file' or 'manual'
  const [loading, setLoading] = useState(false);

  const submitPrediction = async (payload) => {
    if (!payload?.patientName) {
      toast.error('Patient name is required.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/predict/predict', payload);
      toast.success('Prediction completed!');
      navigate(`/prediction/${response.data.record.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileUpload = async (extractedData) => {
    await submitPrediction(extractedData);
  };
  
  const handleManualSubmit = async (formData) => {
    await submitPrediction(formData);
  };
  
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Upload Patient Data</h1>
        
        {/* Mode Toggle */}
        <div className="card mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setMode('file')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'file'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'manual'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Manual Entry
            </button>
          </div>
        </div>
        
        {/* Content */}
        {loading ? (
          <div className="card text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p>Processing prediction...</p>
          </div>
        ) : (
          <>
            {mode === 'file' ? (
              <FileUpload onUpload={handleFileUpload} />
            ) : (
              <ManualEntryForm onSubmit={handleManualSubmit} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UploadPage;

