import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const fmt = (n, currency='INR') => new Intl.NumberFormat('en-IN', { style:'currency', currency, maximumFractionDigits:0 }).format(n || 0);
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#6366f1','#a855f7','#f97316','#22c55e','#ef4444','#06b6d4','#eab308','#ec4899','#14b8a6','#8b5cf6'];

export default function Reports() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearlyData, setYearlyData] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchYearly(); }, [year]);
  useEffect(() => { fetchSummary(); }, [month, year]);

  const fetchYearly = async () => {
    try {
      const res = await API.get(`/transactions/yearly?year=${year}`);
      setYearlyData(res.data.data.map(d => ({ ...d, monthName: MONTHS_SHORT[d.month-1], net: d.income - d.expense })));
    } catch {}
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/transactions/summary?month=${month}&year=${year}`);
      setSummary(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  const totalIncome = yearlyData.reduce((s,d) => s + d.income, 0);
  const totalExpense = yearlyData.reduce((s,d) => s + d.expense, 0);
  const totalNet = totalIncome - totalExpense;

  const pieData = summary?.categoryBreakdown?.slice(0, 8).map((c, i) => ({
    name: `${c.category?.icon || ''} ${c.category?.name || 'Other'}`,
    value: c.amount,
    color: c.category?.color || COLORS[i % COLORS.length],
  })) || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 16px' }}>
        <p style={{ fontWeight:700, marginBottom:6, fontSize:13 }}>{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ fontSize:12, color: p.color }}>
            {p.name}: {fmt(p.value, currency)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Reports & Analytics</h1>
          <p className="page-subtitle">In-depth financial analysis and trends</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <select className="filter-input" value={year} onChange={e => setYear(+e.target.value)}>
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Yearly Summary */}
      <div className="stats-grid" style={{ marginBottom:24 }}>
        <div className="stat-card income"><div className="stat-label">Total Income {year}</div><div className="stat-value income">{fmt(totalIncome, currency)}</div><div className="stat-icon">💚</div></div>
        <div className="stat-card expense"><div className="stat-label">Total Expenses {year}</div><div className="stat-value expense">{fmt(totalExpense, currency)}</div><div className="stat-icon">💸</div></div>
        <div className="stat-card balance"><div className="stat-label">Net Savings {year}</div><div className="stat-value balance">{fmt(totalNet, currency)}</div><div className="stat-icon">🏦</div></div>
        <div className="stat-card savings">
          <div className="stat-label">Savings Rate</div>
          <div className="stat-value savings">{totalIncome > 0 ? Math.round((totalNet/totalIncome)*100) : 0}%</div>
          <div className="stat-icon">📊</div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="chart-card" style={{ marginBottom:20 }}>
        <div className="chart-header">
          <span className="chart-title">📊 Monthly Income vs Expenses ({year})</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={yearlyData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,74,0.8)" vertical={false} />
            <XAxis dataKey="monthName" tick={{ fill:'#64748b', fontSize:12 }} />
            <YAxis tick={{ fill:'#64748b', fontSize:11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={v => <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{v}</span>} />
            <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4,4,0,0]} />
            <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Net Savings Line */}
      <div className="chart-card" style={{ marginBottom:20 }}>
        <div className="chart-header">
          <span className="chart-title">📉 Monthly Net Savings Trend</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={yearlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,74,0.8)" />
            <XAxis dataKey="monthName" tick={{ fill:'#64748b', fontSize:12 }} />
            <YAxis tick={{ fill:'#64748b', fontSize:11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="net" name="Net Savings" stroke="#6366f1" strokeWidth={2.5} dot={{ r:4, fill:'#6366f1' }} activeDot={{ r:6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Pie + Breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">🍩 Spending by Category</span>
            <div style={{ display:'flex', gap:8 }}>
              <select className="filter-input" style={{ fontSize:12, padding:'4px 8px' }} value={month} onChange={e => setMonth(+e.target.value)}>
                {MONTHS_SHORT.map((m,i) => <option key={m} value={i+1}>{m}</option>)}
              </select>
            </div>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v, currency)} />
                <Legend formatter={v => <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding:40 }}><div className="empty-icon">🍩</div><p>No data for this month</p></div>}
        </div>

        <div className="card">
          <div className="card-title">📂 Category Details — {MONTHS_SHORT[month-1]} {year}</div>
          {loading ? <div className="skeleton" style={{ height:200, borderRadius:8 }} /> : (
            summary?.categoryBreakdown?.map((c, i) => {
              const pct = summary.totalExpense > 0 ? Math.round((c.amount / summary.totalExpense) * 100) : 0;
              return (
                <div key={c.category?.id || i} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:13 }}>
                    <span style={{ fontWeight:500 }}>{c.category?.icon} {c.category?.name}</span>
                    <span style={{ fontWeight:700, color:'var(--red)' }}>{fmt(c.amount, currency)} <span style={{ color:'var(--text-muted)', fontWeight:400 }}>({pct}%)</span></span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill safe" style={{ width:`${pct}%`, background: c.category?.color || '#6366f1' }} />
                  </div>
                </div>
              );
            })
          )}
          {!summary?.categoryBreakdown?.length && !loading && <div className="empty-state" style={{ padding:'24px 0' }}><p>No expense data</p></div>}
        </div>
      </div>
    </div>
  );
}
