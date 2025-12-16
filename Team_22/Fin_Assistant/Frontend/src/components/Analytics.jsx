import React, { useEffect, useState, useMemo } from 'react';
import { api } from './api.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, BarElement } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, BarElement);

export default function Analytics({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.listTx(user._id);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Advanced analytics calculations
  const analytics = useMemo(() => {
    if (!transactions.length) return null;

    const now = new Date();
    const timeRanges = {
      '1month': 1,
      '3months': 3,
      '6months': 6,
      '1year': 12
    };
    
    const monthsBack = timeRanges[timeRange] || 6;
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
    
    const filteredTx = transactions.filter(tx => new Date(tx.date) >= cutoffDate);
    
    // Spending trends by month
    const monthlySpending = {};
    const monthlyIncome = {};
    
    filteredTx.forEach(tx => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (tx.type === 'expense') {
        monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + tx.amount;
      } else if (tx.type === 'income') {
        monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + tx.amount;
      }
    });

    // Category analysis
    const categorySpending = {};
    const categoryCount = {};
    
    filteredTx.filter(tx => tx.type === 'expense').forEach(tx => {
      categorySpending[tx.category] = (categorySpending[tx.category] || 0) + tx.amount;
      categoryCount[tx.category] = (categoryCount[tx.category] || 0) + 1;
    });

    // Payment method analysis
    const paymentMethodData = {};
    filteredTx.forEach(tx => {
      paymentMethodData[tx.paymentMode] = (paymentMethodData[tx.paymentMode] || 0) + tx.amount;
    });

    // Spending velocity (transactions per day)
    const daysDiff = Math.max(1, (now - cutoffDate) / (1000 * 60 * 60 * 24));
    const spendingVelocity = filteredTx.filter(tx => tx.type === 'expense').length / daysDiff;

    // Average transaction size
    const expenseTx = filteredTx.filter(tx => tx.type === 'expense');
    const avgTransactionSize = expenseTx.length > 0 
      ? expenseTx.reduce((sum, tx) => sum + tx.amount, 0) / expenseTx.length 
      : 0;

    // Savings rate
    const totalIncome = filteredTx.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpenses = filteredTx.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Top merchants
    const merchantSpending = {};
    filteredTx.filter(tx => tx.type === 'expense' && tx.merchant).forEach(tx => {
      merchantSpending[tx.merchant] = (merchantSpending[tx.merchant] || 0) + tx.amount;
    });

    const topMerchants = Object.entries(merchantSpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      monthlySpending,
      monthlyIncome,
      categorySpending,
      categoryCount,
      paymentMethodData,
      spendingVelocity,
      avgTransactionSize,
      savingsRate,
      topMerchants,
      totalIncome,
      totalExpenses,
      totalTransactions: filteredTx.length
    };
  }, [transactions, timeRange]);

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="no-data">No data available for analytics</div>;
  }

  const monthlyLabels = Object.keys(analytics.monthlySpending).sort();
  const spendingData = monthlyLabels.map(month => analytics.monthlySpending[month] || 0);
  const incomeData = monthlyLabels.map(month => analytics.monthlyIncome[month] || 0);

  const monthlyTrendData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      },
      {
        label: 'Expenses',
        data: spendingData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      }
    ]
  };

  const categoryData = {
    labels: Object.keys(analytics.categorySpending),
    datasets: [{
      data: Object.values(analytics.categorySpending),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
      ]
    }]
  };

  const paymentMethodData = {
    labels: Object.keys(analytics.paymentMethodData),
    datasets: [{
      data: Object.values(analytics.paymentMethodData),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
    }]
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Advanced Analytics</h2>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="time-range-selector"
        >
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      <div className="analytics-grid">
        {/* Key Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Savings Rate</h3>
            <div className="metric-value">{analytics.savingsRate.toFixed(1)}%</div>
            <div className="metric-trend">
              {analytics.savingsRate > 20 ? '🟢 Excellent' : 
               analytics.savingsRate > 10 ? '🟡 Good' : '🔴 Needs Improvement'}
            </div>
          </div>
          
          <div className="metric-card">
            <h3>Avg Transaction</h3>
            <div className="metric-value">₹{analytics.avgTransactionSize.toFixed(0)}</div>
            <div className="metric-trend">Per transaction</div>
          </div>
          
          <div className="metric-card">
            <h3>Spending Velocity</h3>
            <div className="metric-value">{analytics.spendingVelocity.toFixed(1)}</div>
            <div className="metric-trend">Transactions/day</div>
          </div>
          
          <div className="metric-card">
            <h3>Total Transactions</h3>
            <div className="metric-value">{analytics.totalTransactions}</div>
            <div className="metric-trend">In selected period</div>
          </div>
        </div>

        {/* Charts */}
        <div className="chart-container full-width">
          <h3>Income vs Expenses Trend</h3>
          <Line data={monthlyTrendData} options={{
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
          }} />
        </div>

        {/* 👇 START: ADD THIS WRAPPER DIV 👇 */}
        <div className="charts-row">
          <div className="chart-container half-width">
            <h3>Spending by Category</h3>
            <Doughnut data={categoryData} options={{
              responsive: true,
              plugins: { legend: { position: 'bottom' } }
            }} />
          </div>

          <div className="chart-container half-width">
            <h3>Payment Methods</h3>
            <Doughnut data={paymentMethodData} options={{
              responsive: true,
              plugins: { legend: { position: 'bottom' } }
            }} />
          </div>
        </div>

        
        {/* Top Merchants */}
        <div className="chart-container full-width">
          <h3>Top Merchants</h3>
          <div className="merchants-list">
            {analytics.topMerchants.map(([merchant, amount], index) => (
              <div key={merchant} className="merchant-item">
                <span className="merchant-rank">#{index + 1}</span>
                <span className="merchant-name">{merchant}</span>
                <span className="merchant-amount">₹{amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
