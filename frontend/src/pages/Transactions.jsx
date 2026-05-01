import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import toast from 'react-hot-toast';
import TransactionModal from '../components/TransactionModal';

const fmt = (n, currency='INR') => new Intl.NumberFormat('en-IN', { style:'currency', currency, maximumFractionDigits:0 }).format(n || 0);
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Transactions() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total:0, page:1, pages:1 });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [filters, setFilters] = useState({ type:'', categoryId:'', startDate:'', endDate:'', search:'', page:1 });
  const [categories, setCategories] = useState([]);
  const fileRef = useRef(null);

  useEffect(() => { API.get('/categories').then(r => setCategories(r.data.data)).catch(()=>{}); }, []);
  useEffect(() => { fetchTransactions(); }, [filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k,v]) => { if (v) params.set(k, v); });
      params.set('limit', 15);
      const res = await API.get(`/transactions?${params}`);
      setTransactions(res.data.data);
      setPagination(res.data.pagination);
    } catch {} finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try { await API.delete(`/transactions/${id}`); toast.success('Deleted!'); fetchTransactions(); }
    catch { toast.error('Failed to delete.'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await API.post('/transactions/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`✅ Imported ${res.data.imported} transactions! (${res.data.duplicates} duplicates skipped)`);
      fetchTransactions();
    } catch { toast.error('CSV import failed.'); }
    fileRef.current.value = '';
  };

  const setFilter = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value, page: 1 }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">💳 Transactions</h1>
          <p className="page-subtitle">{pagination.total} total transactions</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <input type="file" ref={fileRef} accept=".csv" style={{ display:'none' }} onChange={handleImport} />
          <button className="btn btn-secondary" onClick={() => fileRef.current.click()}>📁 Import CSV</button>
          <button className="btn btn-primary" onClick={() => { setEditTx(null); setShowModal(true); }}>➕ Add Transaction</button>
        </div>
      </div>

      {/* CSV template hint */}
      <div style={{ background:'rgba(99,102,241,0.05)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:12, color:'var(--text-muted)' }}>
        💡 CSV format: <code style={{ color:'var(--accent)', background:'var(--bg-primary)', padding:'1px 6px', borderRadius:4 }}>date,type,amount,description,category,notes</code> — e.g., 2024-01-15,expense,500,Coffee,Food & Dining,Morning coffee
      </div>

      {/* Filters */}
      <div className="filters-row">
        <input className="filter-input" placeholder="🔍 Search transactions..." value={filters.search} onChange={setFilter('search')} style={{ flex:1, minWidth:200 }} />
        <select className="filter-input" value={filters.type} onChange={setFilter('type')}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select className="filter-input" value={filters.categoryId} onChange={setFilter('categoryId')}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <input type="date" className="filter-input" value={filters.startDate} onChange={setFilter('startDate')} />
        <input type="date" className="filter-input" value={filters.endDate} onChange={setFilter('endDate')} />
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ type:'', categoryId:'', startDate:'', endDate:'', search:'', page:1 })}>✕ Clear</button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height:16, width:'80%' }} /></td>
                  ))}
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No transactions found</h3>
                    <p>Add your first transaction or adjust filters</p>
                  </div>
                </td>
              </tr>
            ) : transactions.map(tx => (
              <tr key={tx.id}>
                <td><span className={`badge badge-${tx.type}`}>{tx.type === 'income' ? '💚 Income' : '💸 Expense'}</span></td>
                <td style={{ color:'var(--text-muted)', fontSize:13 }}>{tx.date}</td>
                <td>
                  <div style={{ fontWeight:600, fontSize:13 }}>{tx.description}</div>
                  {tx.merchant && <div style={{ fontSize:11, color:'var(--text-muted)' }}>📍 {tx.merchant}</div>}
                </td>
                <td>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13 }}>
                    <span style={{ width:28, height:28, borderRadius:8, background: tx.category?.color + '22', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {tx.category?.icon || '📌'}
                    </span>
                    {tx.category?.name || '—'}
                  </span>
                </td>
                <td style={{ fontWeight:700, color: tx.type === 'income' ? 'var(--green)' : 'var(--red)', fontSize:14 }}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, currency)}
                </td>
                <td>
                  {tx.tags?.map(tag => (
                    <span key={tag} style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:4, padding:'1px 6px', fontSize:11, marginRight:4, color:'var(--text-muted)' }}>
                      {tag}
                    </span>
                  ))}
                </td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={() => { setEditTx(tx); setShowModal(true); }} title="Edit">✏️</button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(tx.id)} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:20 }}>
          <button className="btn btn-secondary btn-sm" disabled={filters.page <= 1}
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
          <span style={{ padding:'6px 14px', fontSize:13, color:'var(--text-muted)' }}>
            Page {filters.page} of {pagination.pages}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={filters.page >= pagination.pages}
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
        </div>
      )}

      {showModal && <TransactionModal editTx={editTx} onClose={() => { setShowModal(false); setEditTx(null); fetchTransactions(); }} />}
    </div>
  );
}
