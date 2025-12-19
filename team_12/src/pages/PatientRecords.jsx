import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { isDoctor } from '../utils/auth';

const PatientRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const doctor = isDoctor();
  
  useEffect(() => {
    fetchRecords();
  }, []);
  
  const fetchRecords = async () => {
    try {
      const endpoint = doctor ? '/doctor/records' : '/patient/records';
      const response = await api.get(endpoint);
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
        <h1 className="text-3xl font-bold mb-8">
          {doctor ? 'All Patient Records' : 'My Records'}
        </h1>
        
        {records.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">No records found.</p>
          </div>
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {doctor && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Patient
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record._id}>
                      {doctor && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.patientName || record.patientId?.name || 'Unknown'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          record.sepsisDetected
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {record.sepsisDetected ? 'Sepsis' : 'No Sepsis'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/prediction/${record._id}`}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRecords;

