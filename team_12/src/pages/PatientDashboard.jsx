import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';

const PatientDashboard = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchRecords();
  }, []);
  
  const fetchRecords = async () => {
    try {
      const response = await api.get('/patient/records');
      setRecords(response.data);
    } catch (error) {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">My Records</h1>
        
        {records.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No records found.</p>
            <p className="text-sm text-gray-500">
              Your doctor will upload your records here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {records.map((record) => (
              <div key={record._id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Record from {new Date(record.createdAt).toLocaleDateString()}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Doctor: {record.doctorId?.name || 'Unknown'}
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      record.sepsisDetected
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {record.sepsisDetected ? 'Sepsis Detected' : 'No Sepsis Detected'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/prediction/${record._id}`}
                      className="btn-primary"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;


