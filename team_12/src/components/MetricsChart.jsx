import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatValue = (value) => {
  if (value === undefined || value === null) return 0;
  return Number((value * 100).toFixed(2));
};

const MetricsChart = ({ originalMetrics, vaeMetrics }) => {
  if (!originalMetrics || !vaeMetrics) {
    return <p className="text-gray-500">Model metrics not available yet.</p>;
  }

  const data = [
    {
      name: 'Accuracy',
      Original: formatValue(originalMetrics.accuracy),
      VAE: formatValue(vaeMetrics.accuracy)
    },
    {
      name: 'Precision',
      Original: formatValue(originalMetrics.precision),
      VAE: formatValue(vaeMetrics.precision)
    },
    {
      name: 'Recall',
      Original: formatValue(originalMetrics.recall),
      VAE: formatValue(vaeMetrics.recall)
    },
    {
      name: 'F1 Score',
      Original: formatValue(originalMetrics.f1_score),
      VAE: formatValue(vaeMetrics.f1_score)
    }
  ];
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis unit="%" />
        <Tooltip formatter={(value) => `${value}%`} />
        <Legend />
        <Bar dataKey="Original" fill="#3b82f6" />
        <Bar dataKey="VAE" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MetricsChart;

