import { useState, useEffect, useRef } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';

const TODAY = new Date().toISOString().split('T')[0];

export default function TransactionModal({ onClose, editTx = null }) {
  const [form, setForm] = useState({
    type: editTx?.type || 'expense',
    amount: editTx?.amount || '',
    description: editTx?.description || '',
    merchant: editTx?.merchant || '',
    date: editTx?.date || TODAY,
    categoryId: editTx?.categoryId || '',
    notes: editTx?.notes || '',
    tags: editTx?.tags?.join(',') || '',
    recurring: editTx?.recurring || false,
    recurringPeriod: editTx?.recurringPeriod || 'monthly',
  });
  const [categories, setCategories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const descRef = useRef(null);

  useEffect(() => {
    API.get('/categories').then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  const handleDescChange = async (val) => {
    setForm(f => ({ ...f, description: val }));
    if (val.length > 2) {
      try {
        const res = await API.get(`/transactions/autocomplete?q=${encodeURIComponent(val)}`);
        setSuggestions(res.data.data);
      } catch {}
    } else { setSuggestions([]); }
  };

  const applySuggestion = (s) => {
    setForm(f => ({ ...f, description: s.description, merchant: s.merchant || f.merchant, categoryId: s.categoryId || f.categoryId }));
    setSuggestions([]);
  };

  const filteredCats = categories.filter(c =>
    c.type === 'both' || c.type === form.type
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] };
      if (editTx) {
        await API.put(`/transactions/${editTx.id}`, payload);
        toast.success('Transaction updated! ✏️');
      } else {
        await API.post('/transactions', payload);
        toast.success(form.type === 'income' ? '💚 Income added!' : '💸 Expense recorded!');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save transaction.');
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{editTx ? '✏️ Edit Transaction' : '➕ New Transaction'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Type Toggle */}
        <div className="form-group">
          <div className="type-toggle">
            <button type="button" className={`type-btn income${form.type === 'income' ? ' active' : ''}`} onClick={() => setForm(f => ({ ...f, type: 'income', categoryId: '' }))}>
              💚 Income
            </button>
            <button type="button" className={`type-btn expense${form.type === 'expense' ? ' active' : ''}`} onClick={() => setForm(f => ({ ...f, type: 'expense', categoryId: '' }))}>
              💸 Expense
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount *</label>
              <input className="form-input" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={set('amount')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-input" type="date" value={form.date} max={TODAY} onChange={set('date')} required />
            </div>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Description *</label>
            <input ref={descRef} className="form-input" placeholder="e.g., Swiggy Order, EMI Payment" value={form.description} onChange={e => handleDescChange(e.target.value)} required />
            {suggestions.length > 0 && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, zIndex:10, overflow:'hidden' }}>
                {suggestions.map((s, i) => (
                  <div key={i} onClick={() => applySuggestion(s)}
                    style={{ padding:'8px 14px', cursor:'pointer', fontSize:13, borderBottom:'1px solid var(--border)', transition:'var(--transition)' }}
                    onMouseEnter={e => e.target.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.target.style.background = ''}>
                    🔍 {s.description}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={form.categoryId} onChange={set('categoryId')} required>
                <option value="">Select category</option>
                {filteredCats.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Merchant / Store</label>
              <input className="form-input" placeholder="Optional" value={form.merchant} onChange={set('merchant')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} placeholder="Additional notes..." value={form.notes} onChange={set('notes')} style={{ resize: 'vertical' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input className="form-input" placeholder="groceries, monthly, essential" value={form.tags} onChange={set('tags')} />
          </div>

          <div className="form-group">
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
              <input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))} style={{ width:16, height:16 }} />
              <span className="form-label" style={{ marginBottom:0 }}>Recurring Transaction</span>
            </label>
            {form.recurring && (
              <select className="form-select" style={{ marginTop:8 }} value={form.recurringPeriod} onChange={set('recurringPeriod')}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            )}
          </div>

          <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Saving...' : editTx ? '✏️ Update' : '✅ Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
