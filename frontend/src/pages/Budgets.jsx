import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import toast from 'react-hot-toast';

const fmt = (n, currency='INR') => new Intl.NumberFormat('en-IN', { style:'currency', currency, maximumFractionDigits:0 }).format(n || 0);
const NOW = new Date();

export default function Budgets() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year, setYear] = useState(NOW.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoryId: '', limit: '', month: NOW.getMonth()+1, year: NOW.getFullYear() });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchBudgets(); }, [month, year]);
  useEffect(() => { API.get('/categories').then(r => setCategories(r.data.data.filter(c => c.type !== 'income'))).catch(()=>{}); }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/budgets?month=${month}&year=${year}`);
      setBudgets(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/budgets', { ...form, month, year });
      toast.success('Budget set! 🎯');
      setShowForm(false);
      setForm({ categoryId:'', limit:'', month, year });
      fetchBudgets();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to set budget.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this budget?')) return;
    try { await API.delete(`/budgets/${id}`); toast.success('Budget removed.'); fetchBudgets(); }
    catch { toast.error('Failed to remove budget.'); }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🎯 Budgets</h1>
          <p className="page-subtitle">Manage your spending limits for {MONTHS[month-1]} {year}</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <select className="filter-input" value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m,i) => <option key={m} value={i+1}>{m}</option>)}
          </select>
          <select className="filter-input" value={year} onChange={e => setYear(+e.target.value)}>
            {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '➕ Set Budget'}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="stats-grid" style={{ marginBottom:24 }}>
        <div className="stat-card balance">
          <div className="stat-label">Total Budget</div>
          <div className="stat-value balance">{fmt(totalBudget, currency)}</div>
          <div className="stat-sub">across {budgets.length} categories</div>
          <div className="stat-icon">🎯</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value expense">{fmt(totalSpent, currency)}</div>
          <div className="stat-sub">{totalBudget > 0 ? Math.round((totalSpent/totalBudget)*100) : 0}% of budget used</div>
          <div className="stat-icon">💸</div>
        </div>
        <div className="stat-card income">
          <div className="stat-label">Remaining</div>
          <div className="stat-value income">{fmt(totalBudget - totalSpent, currency)}</div>
          <div className="stat-sub">left to spend</div>
          <div className="stat-icon">✅</div>
        </div>
        <div className="stat-card savings">
          <div className="stat-label">Budget Health</div>
          <div className="stat-value savings">
            {budgets.filter(b => b.percentage >= 90).length > 0 ? '⚠️ At Risk' : '✅ Healthy'}
          </div>
          <div className="stat-sub">{budgets.filter(b => b.percentage >= 90).length} categories over 90%</div>
          <div className="stat-icon">💡</div>
        </div>
      </div>

      {/* Add Budget Form */}
      {showForm && (
        <div className="card" style={{ marginBottom:24 }}>
          <h3 style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>🎯 Set New Budget</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.categoryId} onChange={e => setForm(f => ({...f, categoryId: e.target.value}))} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Budget Limit ({currency})</label>
                <input className="form-input" type="number" min="1" step="1" placeholder="e.g., 5000" value={form.limit} onChange={e => setForm(f => ({...f, limit: e.target.value}))} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">✅ Set Budget</button>
          </form>
        </div>
      )}

      {/* Budget Cards */}
      {loading ? (
        <div className="budget-grid">
          {Array.from({length:4}).map((_,i) => <div key={i} className="skeleton" style={{ height:150, borderRadius:12 }} />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>No budgets set</h3>
          <p>Click "Set Budget" to start tracking your spending limits</p>
        </div>
      ) : (
        <div className="budget-grid">
          {budgets.map(b => {
            const pct = b.percentage || 0;
            const progressClass = pct >= 100 ? 'danger' : pct >= 90 ? 'danger' : pct >= 75 ? 'warning' : 'safe';
            return (
              <div key={b.id} className="budget-card" style={{ borderColor: pct >= 90 ? 'rgba(239,68,68,0.4)' : undefined }}>
                <div className="budget-cat">
                  <div className="budget-cat-icon" style={{ background: (b.category?.color || '#6366f1') + '22' }}>
                    {b.category?.icon || '📌'}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{b.category?.name}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                      {pct >= 90 ? '🔴 Over limit!' : pct >= 75 ? '🟡 Use with caution' : '🟢 On track'}
                    </div>
                  </div>
                  <button className="btn btn-danger btn-icon btn-sm" style={{ marginLeft:'auto' }} onClick={() => handleDelete(b.id)}>🗑️</button>
                </div>

                <div className="budget-amounts">
                  <span>Spent: <strong style={{ color: pct >= 90 ? 'var(--red)' : 'var(--text-primary)' }}>{fmt(b.spent, currency)}</strong></span>
                  <span>Limit: <strong>{fmt(b.limit, currency)}</strong></span>
                </div>

                <div className="progress-bar" style={{ marginBottom:8 }}>
                  <div className={`progress-fill ${progressClass}`} style={{ width:`${Math.min(pct, 100)}%` }} />
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)' }}>
                  <span>{pct}% used</span>
                  <span>Remaining: <strong style={{ color:'var(--green)' }}>{fmt(Math.max(b.limit - b.spent, 0), currency)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
