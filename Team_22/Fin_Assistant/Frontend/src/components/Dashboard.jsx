import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { Doughnut, Line, Bar, Radar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, BarElement, RadialLinearScale } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, BarElement, RadialLinearScale);

export default function Dashboard({ user, reportsOnly = false, budgetsOnly = false }) {
  const [tx, setTx] = useState([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [income, setIncome] = useState(50000);
  const [budget, setBudget] = useState(null);

  // ✅ For SMS input
  const [sms, setSms] = useState('');

  const load = async () => {
    const [items, bd] = await Promise.all([api.listTx(user._id), api.getBudget(user._id)]);
    setTx(items);
    setBudget(bd);
  };
  useEffect(() => { 
    load(); 
    
    // Auto-refresh data every 30 seconds
    const interval = setInterval(load, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const addQuick = async () => {
    if (!desc || !amount) return;
    const payload = { userId: user._id, description: desc, amount: Number(amount), type, paymentMode };
    const created = await api.addTx(payload);
    setTx([created, ...tx]);
    setDesc(''); setAmount('');
  };

  // ✅ Add from SMS
  const addFromSms = async () => {
    if (!sms) return;
    const created = await api.smsTx({ userId: user._id, sms });
    setTx([created, ...tx]);
    setSms('');
  };

  const genBudget = async () => {
    const cfg = await api.genBudget(user._id, Number(income));
    setBudget(cfg);
  };

  const byCategory = useMemo(() => {
    const m = {};
    tx.filter(t => t.type === 'expense').forEach(t => { m[t.category] = (m[t.category] || 0) + t.amount; });
    return m;
  }, [tx]);

  const monthlyTrend = useMemo(() => {
    const map = {};
    tx.forEach(t => {
      const d = new Date(t.date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[k] = (map[k] || 0) + (t.type === 'expense' ? t.amount : 0);
    });
    const labels = Object.keys(map).sort();
    return { labels, data: labels.map(l => map[l]) };
  }, [tx]);

  // New data processing functions for enhanced insights
  const paymentMethodData = useMemo(() => {
    const map = {};
    tx.filter(t => t.type === 'expense').forEach(t => {
      map[t.paymentMode] = (map[t.paymentMode] || 0) + t.amount;
    });
    return {
      labels: Object.keys(map),
      data: Object.values(map),
      backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#1A535C', '#FF9F1C', '#6A4C93']
    };
  }, [tx]);

  const weeklySpending = useMemo(() => {
    const map = {};
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    
    tx.filter(t => t.type === 'expense' && new Date(t.date) >= startOfWeek).forEach(t => {
      const d = new Date(t.date);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      map[dayName] = (map[dayName] || 0) + t.amount;
    });
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      labels: days,
      data: days.map(day => map[day] || 0)
    };
  }, [tx]);

  const categoryTrends = useMemo(() => {
    const categories = [...new Set(tx.filter(t => t.type === 'expense').map(t => t.category))];
    const monthlyData = {};
    
    tx.filter(t => t.type === 'expense').forEach(t => {
      const d = new Date(t.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) monthlyData[monthKey] = {};
      monthlyData[monthKey][t.category] = (monthlyData[monthKey][t.category] || 0) + t.amount;
    });
    
    const months = Object.keys(monthlyData).sort();
    const datasets = categories.map((category, index) => ({
      label: category,
      data: months.map(month => monthlyData[month][category] || 0),
      borderColor: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#1A535C', '#FF9F1C', '#6A4C93', '#2EC4B6', '#E63946'][index % 8],
      backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#1A535C', '#FF9F1C', '#6A4C93', '#2EC4B6', '#E63946'][index % 8] + '20',
      tension: 0.3
    }));
    
    return { labels: months, datasets };
  }, [tx]);

  const financialInsights = useMemo(() => {
    const totalIncome = tx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = tx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
    const avgTransactionSize = tx.length > 0 ? (totalIncome + totalExpenses) / tx.length : 0;
    const expenseCount = tx.filter(t => t.type === 'expense').length;
    const incomeCount = tx.filter(t => t.type === 'income').length;
    
    // Calculate spending velocity (expenses per day)
    const expenseDates = tx.filter(t => t.type === 'expense').map(t => new Date(t.date));
    const dateRange = expenseDates.length > 0 ? 
      (Math.max(...expenseDates) - Math.min(...expenseDates)) / (1000 * 60 * 60 * 24) + 1 : 1;
    const spendingVelocity = dateRange > 0 ? totalExpenses / dateRange : 0;
    
    // Calculate largest transaction
    const largestTransaction = tx.length > 0 ? Math.max(...tx.map(t => t.amount)) : 0;
    
    return {
      totalIncome,
      totalExpenses,
      savings,
      savingsRate,
      avgTransactionSize,
      expenseCount,
      incomeCount,
      netWorth: savings,
      spendingVelocity,
      largestTransaction
    };
  }, [tx]);

  const dailySpendingPattern = useMemo(() => {
    const map = {};
    tx.filter(t => t.type === 'expense').forEach(t => {
      const d = new Date(t.date);
      const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
      map[dayOfWeek] = (map[dayOfWeek] || 0) + t.amount;
    });
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      labels: dayNames,
      data: dayNames.map((_, index) => map[index] || 0)
    };
  }, [tx]);

  if (reportsOnly) {
    return (
      <section className="section active">
        <div className="section-header">
          <h1>Reports</h1>
          <p className="text-secondary">Comprehensive financial insights & analytics</p>
        </div>

        {/* Financial Insights Cards */}
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">💰</div>
            <div className="insight-content">
              <h4>Total Income</h4>
              <p className="insight-value">₹{financialInsights.totalIncome.toLocaleString()}</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">💸</div>
            <div className="insight-content">
              <h4>Total Expenses</h4>
              <p className="insight-value">₹{financialInsights.totalExpenses.toLocaleString()}</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <h4>Savings Rate</h4>
              <p className="insight-value">{financialInsights.savingsRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">📊</div>
            <div className="insight-content">
              <h4>Avg Transaction</h4>
              <p className="insight-value">₹{financialInsights.avgTransactionSize.toFixed(0)}</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">⚡</div>
            <div className="insight-content">
              <h4>Spending Velocity</h4>
              <p className="insight-value">₹{financialInsights.spendingVelocity.toFixed(0)}/day</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">💎</div>
            <div className="insight-content">
              <h4>Largest Transaction</h4>
              <p className="insight-value">₹{financialInsights.largestTransaction.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Monthly Spending Trend */}
          <div className="chart-container half-width">
            <h3>Monthly Spending Trend</h3>
            <Line
              data={{
                labels: monthlyTrend.labels,
                datasets: [{
                  label: 'Expenses',
                  data: monthlyTrend.data,
                  borderColor: '#4ECDC4',
                  backgroundColor: 'rgba(78, 205, 196, 0.2)',
                  tension: 0.3,
                  fill: true,
                }]
              }}
              options={{
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }}
            />
          </div>

          {/* Category Trends Over Time */}
          <div className="chart-container half-width">
            <h3>Category Spending Trends</h3>
            <Line
              data={{
                labels: categoryTrends.labels,
                datasets: categoryTrends.datasets
              }}
              options={{
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } },
                interaction: { mode: 'index', intersect: false }
              }}
            />
          </div>

          {/* Weekly Spending Pattern */}
          <div className="chart-container half-width">
            <h3>This Week's Spending</h3>
            <Bar
              data={{
                labels: weeklySpending.labels,
                datasets: [{
                  label: 'Amount (₹)',
                  data: weeklySpending.data,
                  backgroundColor: 'rgba(78, 205, 196, 0.8)',
                  borderColor: '#4ECDC4',
                  borderWidth: 1
                }]
              }}
              options={{
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }}
            />
          </div>

          {/* Daily Spending Pattern */}
          <div className="chart-container half-width">
            <h3>Daily Spending Pattern</h3>
            <Bar
              data={{
                labels: dailySpendingPattern.labels,
                datasets: [{
                  label: 'Amount (₹)',
                  data: dailySpendingPattern.data,
                  backgroundColor: 'rgba(255, 107, 107, 0.8)',
                  borderColor: '#FF6B6B',
                  borderWidth: 1
                }]
              }}
              options={{
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }}
            />
          </div>

          {/* Payment Methods */}
          <div className="chart-container half-width">
            <h3>Spending by Payment Method</h3>
            <Bar
              data={{
                labels: paymentMethodData.labels,
                datasets: [{
                  label: 'Amount (₹)',
                  data: paymentMethodData.data,
                  backgroundColor: paymentMethodData.backgroundColor,
                  borderWidth: 1
                }]
              }}
              options={{
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }}
            />
          </div>

          {/* Spending by Category */}
          <div className="chart-container half-width">
            <h3>Spending by Category</h3>
            <Doughnut
              data={{
                labels: Object.keys(byCategory),
                datasets: [{
                  data: Object.values(byCategory),
                  backgroundColor: [
                    '#FF6B6B', '#4ECDC4', '#FFD93D', '#1A535C',
                    '#FF9F1C', '#6A4C93', '#2EC4B6', '#E63946',
                    '#F4A261', '#264653'
                  ],
                  borderWidth: 2,
                  borderColor: '#fff'
                }]
              }}
              options={{
                plugins: {
                  legend: { position: 'bottom', labels: { color: '#333', font: { size: 14 } } }
                }
              }}
            />
          </div>
        </div>

        {/* Budget vs Actual Comparison */}
        {budget && (
          <div className="budget-comparison-section">
            <h3>📊 Budget vs Actual Spending</h3>
            <div className="budget-comparison-grid">
              {Object.entries(budget.caps || {}).map(([category, budgetAmount]) => {
                const actualSpent = byCategory[category] || 0;
                const percentage = budgetAmount > 0 ? (actualSpent / budgetAmount) * 100 : 0;
                const isOverBudget = actualSpent > budgetAmount;
                const remaining = Math.max(0, budgetAmount - actualSpent);
                
                return (
                  <div key={category} className="budget-comparison-card">
                    <div className="budget-header">
                      <h4>{category}</h4>
                      <div className="budget-status">
                        {isOverBudget ? (
                          <span className="status-badge over-budget">Over Budget</span>
                        ) : (
                          <span className="status-badge under-budget">On Track</span>
                        )}
                      </div>
                    </div>
                    <div className="budget-amounts">
                      <div className="amount-row">
                        <span>Budgeted:</span>
                        <span>₹{budgetAmount.toLocaleString()}</span>
                      </div>
                      <div className="amount-row">
                        <span>Spent:</span>
                        <span>₹{actualSpent.toLocaleString()}</span>
                      </div>
                      <div className="amount-row">
                        <span>Remaining:</span>
                        <span className={remaining > 0 ? 'positive' : 'negative'}>
                          ₹{remaining.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="budget-progress-bar">
                      <div 
                        className={`progress-fill ${isOverBudget ? 'over-budget' : 'under-budget'}`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      ></div>
                    </div>
                    <div className="budget-percentage">
                      {percentage.toFixed(1)}% of budget used
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        <div className="recommendations-section">
          <h3>💡 Financial Insights & Recommendations</h3>
          <div className="recommendations-grid">
            {financialInsights.savingsRate < 20 && (
              <div className="recommendation-card warning">
                <h4>⚠️ Low Savings Rate</h4>
                <p>Your savings rate is {financialInsights.savingsRate.toFixed(1)}%. Consider reducing discretionary spending to improve your financial health.</p>
              </div>
            )}
            {financialInsights.savingsRate >= 20 && (
              <div className="recommendation-card success">
                <h4>✅ Great Savings Rate</h4>
                <p>Excellent! You're saving {financialInsights.savingsRate.toFixed(1)}% of your income. Keep up the good work!</p>
              </div>
            )}
            {financialInsights.avgTransactionSize > 1000 && (
              <div className="recommendation-card info">
                <h4>📊 High Transaction Value</h4>
                <p>Your average transaction size is ₹{financialInsights.avgTransactionSize.toFixed(0)}. Consider reviewing large expenses for optimization opportunities.</p>
              </div>
            )}
            {Object.keys(byCategory).length > 0 && (
              <div className="recommendation-card info">
                <h4>🎯 Top Spending Category</h4>
                <p>Your highest spending category is <strong>{Object.keys(byCategory).reduce((a, b) => byCategory[a] > byCategory[b] ? a : b)}</strong> with ₹{Math.max(...Object.values(byCategory)).toLocaleString()}.</p>
              </div>
            )}
            {budget && Object.entries(budget.caps || {}).some(([category, budgetAmount]) => (byCategory[category] || 0) > budgetAmount) && (
              <div className="recommendation-card warning">
                <h4>🚨 Budget Alerts</h4>
                <p>You've exceeded budget in some categories. Review your spending patterns and consider adjusting your budget or reducing expenses.</p>
              </div>
            )}
            {financialInsights.spendingVelocity > 1000 && (
              <div className="recommendation-card info">
                <h4>⚡ High Spending Velocity</h4>
                <p>You're spending ₹{financialInsights.spendingVelocity.toFixed(0)} per day on average. Consider tracking daily expenses more closely to identify optimization opportunities.</p>
              </div>
            )}
            {dailySpendingPattern.data.some((amount, index) => amount > 0 && [0, 6].includes(index)) && (
              <div className="recommendation-card info">
                <h4>📅 Weekend Spending</h4>
                <p>You tend to spend more on weekends. Consider planning weekend activities with a budget in mind to avoid overspending.</p>
              </div>
            )}
            {financialInsights.largestTransaction > 5000 && (
              <div className="recommendation-card info">
                <h4>💎 Large Transaction Alert</h4>
                <p>Your largest transaction was ₹{financialInsights.largestTransaction.toLocaleString()}. Review if this was a planned expense or an impulse purchase.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (budgetsOnly) {
    return (
      <section className="section active">
        <div className="section-header">
          <h1>Budgets</h1>
          <p className="text-secondary">Generate dynamic category caps</p>
        </div>

        <div className="budget-setup card">
          <div className="card__body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Monthly Income (₹)</label>
                <input className="form-control" type="number" value={income} onChange={e => setIncome(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Actions</label>
                <button className="btn btn--primary" onClick={genBudget}>Generate Budget</button>
              </div>
            </div>
          </div>
        </div>

        {budget && (
          <div className="budget-progress card">
            <div className="card__body">
              <h3>Category Caps</h3>
              <div className="progress-bars">
                {Object.entries(budget.caps || {}).map(([cat, cap]) => {
                  const spent = byCategory[cat] || 0;
                  const pct = Math.min(100, Math.round((spent / (cap || 1)) * 100));
                  return (
                    <div key={cat} className="progress-item">
                      <div className="progress-header">
                        <div className="progress-category">{cat}</div>
                        <div className="progress-amounts">₹{spent.toFixed(0)} / ₹{cap}</div>
                      </div>
                      <div className="progress-bar">
                        <div className={"progress-fill " + (spent > cap ? 'over-budget' : '')} style={{ width: pct + '%' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="section active">
      <div className="section-header">
        <h1>Dashboard</h1>
        <p className="text-secondary">Quick add, SMS add, insights & recent transactions</p>
      </div>

      {/* Quick Add */}
      <div className="quick-expense card">
        <div className="card__body">
          <div className="quick-form-row">
            <div>
              <label className="form-label">Description (UPI/SMS allowed)</label>
              <input className="form-control" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g., Paid Rs.249 to Zomato for lunch" />
            </div>
            <div>
              <label className="form-label">Amount</label>
              <input className="form-control" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Type</label>
              <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                <option>expense</option>
                <option>income</option>
              </select>
            </div>
            <div>
              <label className="form-label">Payment</label>
              <select className="form-control" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                <option>UPI</option>
                <option>Card</option>
                <option>Cash</option>
                <option>NetBanking</option>
                <option>Wallet</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <button className="btn btn--primary" onClick={addQuick}>Add</button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Add from SMS */}
      <div className="quick-expense card">
        <div className="card__body">
          <h3>Add from SMS</h3>
          <div className="quick-form-row">
            <div style={{ flex: 1 }}>
              <label className="form-label">Paste SMS</label>
              <input
                className="form-control"
                value={sms}
                onChange={e => setSms(e.target.value)}
                placeholder="e.g., Paid Rs. 500.00 to Uber via UPI Ref No 123456"
              />
            </div>
            <div>
              <button className="btn btn--secondary" onClick={addFromSms}>
                Add from SMS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Monthly Spending Trend */}
        <div className="chart-container full-width">
          <h3>Monthly Spending Trend</h3>
          <Line
            data={{
              labels: monthlyTrend.labels,
              datasets: [{
                label: 'Expenses',
                data: monthlyTrend.data,
                borderColor: '#4ECDC4',
                backgroundColor: 'rgba(78, 205, 196, 0.2)',
                tension: 0.3,
                fill: true,
              }]
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } }
            }}
          />
        </div>

        {/* Spending by Category */}
        <div className="chart-container small-width">
          <h3>Spending by Category</h3>
          <Doughnut
            data={{
              labels: Object.keys(byCategory),
              datasets: [{
                data: Object.values(byCategory),
                backgroundColor: [
                  '#FF6B6B', '#4ECDC4', '#FFD93D', '#1A535C',
                  '#FF9F1C', '#6A4C93', '#2EC4B6', '#E63946',
                  '#F4A261', '#264653'
                ],
                borderWidth: 2,
                borderColor: '#fff'
              }]
            }}
            options={{
              plugins: {
                legend: { position: 'bottom', labels: { color: '#333', font: { size: 10 } } }
              }
            }}
          />
        </div>

        {/* Income vs Expenses */}
        <div className="chart-container small-width">
          <h3>Income vs Expenses</h3>
          <Doughnut
            data={{
              labels: ['Income', 'Expense'],
              datasets: [{
                data: [
                  tx.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0),
                  tx.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0)
                ],
                backgroundColor: ['#4CAF50', '#F44336'],
                borderWidth: 2,
                borderColor: '#fff'
              }]
            }}
            options={{
              plugins: { 
                legend: { position: 'bottom', labels: { color: '#333', font: { size: 10 } } }
              }
            }}
          />
        </div>
      </div>

      {/* Transactions */}
      <div className="card">
        <div className="card__body">
          <h3>Recent Transactions</h3>
          <div className="transactions-list">
            {tx.map((t, i) => (
              <div key={t._id || i} className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-icon">💸</div>
                  <div className="transaction-details">
                    <h4>{t.description}</h4>
                    <p>{t.category} · {new Date(t.date).toLocaleString()}</p>
                    {t.merchant && <span className="payment-mode">{t.merchant}</span>}
                  </div>
                </div>
                <div className="transaction-amount">₹{t.amount}</div>
                <button
                  className="btn btn--danger"
                  onClick={async () => {
                    await api.delTx(t._id);
                    setTx(tx.filter(x => x._id !== t._id));
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
