import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { isDoctor } from '../utils/auth';
import MetricsChart from '../components/MetricsChart';

const PredictionResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const doctor = isDoctor();
  
  useEffect(() => {
    fetchRecord();
  }, [id]);
  
  const fetchRecord = async () => {
    try {
      const response = await api.get(`/predict/${id}`);
      setRecord(response.data);
    } catch (error) {
      toast.error('Failed to load prediction');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadReport = async () => {
    try {
      const response = await api.get(`/predict/${id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sepsis_report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!record) {
    return null;
  }
  const vitalsPreview = record.patientData
    ? Object.entries(record.patientData)
        .filter(([key]) => ['HR', 'O2Sat', 'Temp', 'SBP', 'DBP', 'MAP', 'Resp', 'WBC', 'Lactate'].includes(key))
        .slice(0, 10)
    : [];
  
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Prediction Result</h1>
          <button onClick={handleDownloadReport} className="btn-primary">
            Download Report
          </button>
        </div>
        
        {/* Patient Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Patient Details</h2>
            <p><span className="font-medium">Name:</span> {record.patientName || 'N/A'}</p>
            <p><span className="font-medium">Email:</span> {record.patientEmail || 'N/A'}</p>
            <p><span className="font-medium">Age:</span> {record.patientAge ?? 'N/A'}</p>
            <p><span className="font-medium">Symptoms:</span> {record.symptoms || 'Not provided'}</p>
            <p><span className="font-medium">Doctor:</span> {record.doctor?.name || 'Current Doctor'}</p>
          </div>
          <div className={`card ${
            record.sepsisDetected ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'
          }`}>
            <h2 className="text-2xl font-semibold mb-2">
              {record.sepsisDetected ? '⚠️ Sepsis Detected' : '✅ No Sepsis Detected'}
            </h2>
            <p className="text-gray-600">
              {record.sepsisDetected
                ? 'Our analysis indicates the presence of sepsis. Immediate medical attention is recommended.'
                : 'Our analysis indicates no signs of sepsis at this time.'}
            </p>
          </div>
        </div>
        
        {/* Vital Snapshot */}
        <div className="card mb-6">
          <h3 className="text-xl font-semibold mb-4">Vital Snapshot</h3>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            {vitalsPreview.map(([key, value]) => (
              <div key={key} className="flex justify-between bg-gray-50 px-3 py-2 rounded">
                <span className="font-medium">{key}</span>
                <span>{Number(value).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Model Results - Doctor View */}
        {doctor && (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Original Model */}
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Original Model</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Prediction:</span>{' '}
                    {record.originalModel?.prediction === 1 ? 'Sepsis' : 'No Sepsis'}
                  </p>
                  <p>
                    <span className="font-medium">Probability:</span>{' '}
                    {(record.originalModel?.probability * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">Accuracy:</span>{' '}
                    {(record.originalModel?.metrics?.accuracy * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">Precision:</span>{' '}
                    {(record.originalModel?.metrics?.precision * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">Recall:</span>{' '}
                    {(record.originalModel?.metrics?.recall * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">F1 Score:</span>{' '}
                    {(record.originalModel?.metrics?.f1_score * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
              
              {/* VAE Model */}
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">VAE-Enhanced Model</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Prediction:</span>{' '}
                    {record.vaeModel?.prediction === 1 ? 'Sepsis' : 'No Sepsis'}
                  </p>
                  <p>
                    <span className="font-medium">Probability:</span>{' '}
                    {(record.vaeModel?.probability * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">Accuracy:</span>{' '}
                    {(record.vaeModel?.metrics?.accuracy * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">Precision:</span>{' '}
                    {(record.vaeModel?.metrics?.precision * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">Recall:</span>{' '}
                    {(record.vaeModel?.metrics?.recall * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">F1 Score:</span>{' '}
                    {(record.vaeModel?.metrics?.f1_score * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
            
            {/* Comparison Chart */}
            <div className="card mb-6">
              <h3 className="text-xl font-semibold mb-4">Model Comparison</h3>
              <MetricsChart
                originalMetrics={record.originalModel?.metrics}
                vaeMetrics={record.vaeModel?.metrics}
              />
            </div>
          </>
        )}
        <div className={`card mb-6 ${
          record.sepsisDetected ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'
        }`}>
          <h2 className="text-2xl font-semibold mb-2">
            {record.sepsisDetected ? '⚠️ Sepsis Detected' : '✅ No Sepsis Detected'}
          </h2>
          <p className="text-gray-600">
            {record.sepsisDetected
              ? 'Our analysis indicates the presence of sepsis. Immediate medical attention is recommended.'
              : 'Our analysis indicates no signs of sepsis at this time.'}
          </p>
        </div>
        
        {/* Model Results - Doctor View */}
        {doctor && (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Original Model */}
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Original Model</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Prediction:</span>{' '}
                    {record.originalModel?.prediction === 1 ? 'Sepsis' : 'No Sepsis'}
                  </p>
                  <p>
                    <span className="font-medium">Probability:</span>{' '}
                    {(record.originalModel?.probability * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">Accuracy:</span>{' '}
                    {(record.originalModel?.metrics?.accuracy * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">Precision:</span>{' '}
                    {(record.originalModel?.metrics?.precision * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">Recall:</span>{' '}
                    {(record.originalModel?.metrics?.recall * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">F1 Score:</span>{' '}
                    {(record.originalModel?.metrics?.f1_score * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
              
              {/* VAE Model */}
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">VAE-Enhanced Model</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Prediction:</span>{' '}
                    {record.vaeModel?.prediction === 1 ? 'Sepsis' : 'No Sepsis'}
                  </p>
                  <p>
                    <span className="font-medium">Probability:</span>{' '}
                    {(record.vaeModel?.probability * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">Accuracy:</span>{' '}
                    {(record.vaeModel?.metrics?.accuracy * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">Precision:</span>{' '}
                    {(record.vaeModel?.metrics?.precision * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">Recall:</span>{' '}
                    {(record.vaeModel?.metrics?.recall * 100).toFixed(2)}%
                  </p>
                  <p>
                    <span className="font-medium">F1 Score:</span>{' '}
                    {(record.vaeModel?.metrics?.f1_score * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
            
            {/* Comparison Chart */}
            {chartData.length > 0 && (
              <div className="card mb-6">
                <h3 className="text-xl font-semibold mb-4">Model Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Original" fill="#3b82f6" />
                    <Bar dataKey="VAE" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
        
        {/* Suggestions */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Recommendations</h3>
          <ul className="space-y-2">
            {record.suggestions?.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PredictionResult;

