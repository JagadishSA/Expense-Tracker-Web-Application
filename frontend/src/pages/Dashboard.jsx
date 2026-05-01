import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import TransactionModal from '../components/TransactionModal';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const RCOLORS = ['#6366f1','#a855f7','#f97316','#22c55e','#ef4444','#06b6d4','#eab308','#ec4899','#14b8a6','#8b5cf6'];

const fmt = (n, currency='INR') => new Intl.NumberFormat('en-IN', { style:'currency', currency, maximumFractionDigits:0 }).format(n || 0);

export default function Dashboard() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchSummary(); }, [month, year]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/transactions/summary?month=${month}&year=${year}`);
      setSummary(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  const currency = user?.currency || 'INR';
  const pieData = summary?.categoryBreakdown?.slice(0, 8).map((c, i) => ({
    name: `${c.category?.icon || ''} ${c.category?.name || 'Other'}`,
    value: c.amount,
    color: c.category?.color || RCOLORS[i % RCOLORS.length],
  })) || [];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
          <p style={{ fontWeight: 600, fontSize: 13 }}>{payload[0].name}</p>
          {payload.map(p => (
            <p key={p.dataKey} style={{ fontSize: 12, color: p.color }}>
              {p.dataKey === 'income' ? '📈' : '📉'} {fmt(p.value, currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Dashboard</h1>
          <p className="page-subtitle">Your financial overview for {MONTHS[month-1]} {year}</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <select className="filter-input" value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
          </select>
          <select className="filter-input" value={year} onChange={e => setYear(+e.target.value)}>
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Transaction</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-label">Total Income</div>
          <div className="stat-value income">{fmt(summary?.totalIncome, currency)}</div>
          <div className="stat-sub">💼 {MONTHS[month-1]} earnings</div>
          <div className="stat-icon">💚</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value expense">{fmt(summary?.totalExpense, currency)}</div>
          <div className="stat-sub">💸 {summary?.transactionCount || 0} transactions</div>
          <div className="stat-icon">🔴</div>
        </div>
        <div className="stat-card balance">
          <div className="stat-label">Net Balance</div>
          <div className="stat-value balance">{fmt((summary?.totalIncome || 0) - (summary?.totalExpense || 0), currency)}</div>
          <div className="stat-sub">{((summary?.totalIncome || 0) - (summary?.totalExpense || 0)) >= 0 ? '✅ Surplus' : '⚠️ Deficit'}</div>
          <div className="stat-icon">⚖️</div>
        </div>
        <div className="stat-card savings">
          <div className="stat-label">Savings Rate</div>
          <div className="stat-value savings">
            {summary?.totalIncome > 0 ? Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100) : 0}%
          </div>
          <div className="stat-sub">🏦 of total income</div>
          <div className="stat-icon">💙</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {/* Area Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">💹 Daily Cash Flow</span>
          </div>
          {loading ? <div className="skeleton" style={{ height: 200 }} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={summary?.dailyTrend || []}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,74,0.8)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#incomeGrad)" strokeWidth={2} name="income" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} name="expense" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">🍩 Spending by Category</span>
          </div>
          {loading ? <div className="skeleton" style={{ height: 200 }} /> : pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => fmt(value, currency)} />
                <Legend formatter={(value) => <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-icon">🍩</div>
              <p>No expense data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Expenses + Category Breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Top Expenses */}
        <div className="card">
          <div className="card-title">🔥 Top Expenses</div>
          {summary?.topExpenses?.length ? summary.topExpenses.map(tx => (
            <div key={tx.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:20 }}>{tx.category?.icon || '💸'}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{tx.description}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{tx.date} · {tx.category?.name}</div>
                </div>
              </div>
              <span style={{ color:'var(--red)', fontWeight:700, fontSize:14 }}>-{fmt(tx.amount, currency)}</span>
            </div>
          )) : <div className="empty-state" style={{ padding:'24px 0' }}><p>No expenses this month</p></div>}
          <Link to="/transactions" style={{ display:'block', textAlign:'center', marginTop:12, fontSize:13, color:'var(--accent)' }}>View all →</Link>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="card-title">📂 Category Breakdown</div>
          {summary?.categoryBreakdown?.slice(0,6).map(c => {
            const pct = summary.totalExpense > 0 ? Math.round((c.amount / summary.totalExpense) * 100) : 0;
            return (
              <div key={c.category?.id} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:500 }}>{c.category?.icon} {c.category?.name}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--red)' }}>{fmt(c.amount, currency)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:`${pct}%`, background: c.category?.color || '#6366f1' }} />
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{pct}% of total expenses · {c.count} txns</div>
              </div>
            );
          })}
          {!summary?.categoryBreakdown?.length && <div className="empty-state" style={{ padding:'24px 0' }}><p>No data yet</p></div>}
        </div>
      </div>

      {showModal && <TransactionModal onClose={() => { setShowModal(false); fetchSummary(); }} />}
    </div>
  );
}
