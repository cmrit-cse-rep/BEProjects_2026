import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import MetricsChart from '../components/MetricsChart';

const DoctorDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const [statsRes, recordsRes] = await Promise.all([
        api.get('/doctor/statistics'),
        api.get('/doctor/records?limit=5')
      ]);
      
      setStatistics(statsRes.data);
      setModelMetrics(statsRes.data.modelMetrics || null);
      setRecentRecords(recordsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
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
        <h1 className="text-3xl font-bold mb-8">Doctor Dashboard</h1>
        
        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <h3 className="text-gray-600 mb-2">Total Records</h3>
              <p className="text-3xl font-bold text-primary-600">{statistics.totalRecords}</p>
            </div>
            
            <div className="card">
              <h3 className="text-gray-600 mb-2">Sepsis Detected</h3>
              <p className="text-3xl font-bold text-red-600">{statistics.sepsisDetected}</p>
            </div>
            
            <div className="card">
              <h3 className="text-gray-600 mb-2">Total Patients</h3>
              <p className="text-3xl font-bold text-blue-600">{statistics.totalPatients}</p>
            </div>
            
            <div className="card">
              <h3 className="text-gray-600 mb-2">Sepsis Rate</h3>
              <p className="text-3xl font-bold text-orange-600">{statistics.sepsisRate}%</p>
            </div>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/upload" className="btn-primary">
              Upload Patient Data
            </Link>
            <Link to="/records" className="btn-secondary">
              View All Records
            </Link>
          </div>
        </div>
        
        {/* Model Comparison Chart */}
        {modelMetrics && (
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-4">Model Performance Comparison</h2>
            <MetricsChart
              originalMetrics={modelMetrics.original}
              vaeMetrics={modelMetrics.vae}
            />
          </div>
        )}
        
        {/* Recent Records */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Recent Records</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRecords.map((record) => (
                  <tr key={record._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.patientName || record.patientId?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        record.sepsisDetected ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
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
                        className="text-primary-600 hover:text-primary-800 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        to={`/suggestions/${record._id}`}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        Edit Suggestions
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;

