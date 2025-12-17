// export default Dashboard;
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import toast, { Toaster } from 'react-hot-toast';
import './dashboard.css';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import WeatherAlert from './WeatherAlert';

const Dashboard = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  // For chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#2e7d32', '#d32f2f', '#6a1b9a', '#fbc02d', '#1976d2', '#388e3c'];

  useEffect(() => {
    const fetchHistory = async () => {
      if (isAuthenticated) {
        setLoading(true);
        const toastId = toast.loading('Loading history...');
        try {
          const token = await getAccessTokenSilently();
          // const res = await axios.get('http://localhost:8000/history', {
          const res = await axios.get('https://agroaibackend-f1p9.onrender.com/history', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setHistory(res.data);
          setLoading(false);
          toast.dismiss(toastId);
          toast.success('History loaded!');
        } catch (err) {
          setLoading(false);
          toast.dismiss(toastId);
          toast.error('Failed to load history');
        }
      }
    };
    fetchHistory();
    // Only re-fetch when deleting or auth changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, deleting]);

  // Filtering (case-insensitive, supports partial match)
  const filteredHistory = history.filter(item =>
    filter.trim() === '' ? true : (item.result && item.result.toLowerCase().includes(filter.toLowerCase()))
  );

  // Statistics: Most common disease
  const diseaseCounts = {};
  history.forEach(item => {
    diseaseCounts[item.result] = (diseaseCounts[item.result] || 0) + 1;
  });
  const mostCommonDisease = Object.keys(diseaseCounts).reduce((a, b) => diseaseCounts[a] > diseaseCounts[b] ? a : b, '');

  // Prepare data for charts
  const chartData = Object.keys(diseaseCounts).map((disease, idx) => ({
    name: disease,
    value: diseaseCounts[disease],
    color: COLORS[idx % COLORS.length]
  }));

  // Line chart data: predictions over time
  const lineData = history.map(item => ({
    datetime: item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A',
    disease: item.result
  }));

  // Helper: Convert UTC to IST (Asia/Kolkata)
  const toIST = (utcString) => {
    if (!utcString) return 'N/A';
    const date = new Date(utcString);
    // Convert to IST offset
    const istOffset = 5.5 * 60; // IST is UTC+5:30
    const localDate = new Date(date.getTime() + istOffset * 60000);
    return localDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  };

  // Delete history item
  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const token = await getAccessTokenSilently();
      await axios.delete(`http://localhost:8000/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('History deleted!');
    } catch (err) {
      toast.error('Failed to delete history');
    }
    setDeleting(false);
  };

  return (
    <div className="dashboard-container">
      <Toaster position="top-right" />

      {/* Weather Alert Widget */}
      <WeatherAlert />

      <h2>Your Prediction History</h2>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Filter by disease..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ padding: '0.5rem', width: '200px' }}
        />
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Table Section - now at the top */}
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, marginBottom: '2rem', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th>Disease</th>
                <th>Confidence</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ wordBreak: 'break-word' }}>{item.result}</td>
                  <td>{(parseFloat(item.confidence) * 100).toFixed(2)}%</td>
                  <td>{item.timestamp ? toIST(item.timestamp) : 'N/A'}</td>
                  <td>
                    <button onClick={() => handleDelete(item._id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Charts Section - now at the bottom */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <div style={{ flex: '1 1 300px', minWidth: 300, background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(44,62,80,0.08)', padding: '1rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#1976d2' }}>Predictions per Disease (Bar)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value">
                    {chartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: '1 1 300px', minWidth: 300, background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(44,62,80,0.08)', padding: '1rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#d32f2f' }}>Disease Proportion (Pie)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {chartData.map((entry, idx) => (
                      <Cell key={`cell-pie-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: '1 1 300px', minWidth: 300, background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(44,62,80,0.08)', padding: '1rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#388e3c' }}>Predictions Over Time (Line)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineData}>
                  <XAxis dataKey="datetime" interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="disease" stroke="#388e3c" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="most-common" style={{ marginTop: '2rem', fontWeight: 'bold' }}>
            Most Common Disease Detected: <span style={{ color: '#2e7d32' }}>{mostCommonDisease || 'N/A'}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
