import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_DB_URL = 'http://localhost:5000/api/admin/db';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdminCard, setShowAdminCard] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleAdminAccess = () => {
    window.open(ADMIN_DB_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="auth-page">
      {/* ── Main Login Card ── */}
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">💰</div>
          <span>SpendWise</span>
        </div>
        <h1 className="auth-title">Welcome back!</h1>
        <p className="auth-subtitle">Sign in to your account to continue tracking</p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="john@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: 14, marginTop: 8 }}
            disabled={loading}>
            {loading ? '⏳ Signing in...' : '🔐 Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" className="auth-link">Create one free</Link>
        </p>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* ── Server Admin Button ── */}
        <button
          onClick={() => setShowAdminCard(!showAdminCard)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: 10, padding: '12px 16px', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(168,85,247,0.08)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🛢️</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#c084fc' }}>Server Admin Panel</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Access database & manage server</div>
            </div>
          </div>
          <span style={{ color: '#a855f7', fontSize: 18, transition: 'transform 0.2s', transform: showAdminCard ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </button>

        {/* ── Admin Panel Dropdown ── */}
        {showAdminCard && (
          <div style={{
            marginTop: 8, background: 'rgba(10,14,26,0.95)', border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: 10, padding: 16, animation: 'fadeIn 0.2s ease',
          }}>
            {/* Credentials */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Admin Credentials</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['👤 Username', 'admin'], ['🔐 Password', 'spendwise@admin123']].map(([label, value]) => (
                  <div key={label} style={{ background: 'rgba(30,45,74,0.6)', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                    <code style={{ fontSize: 12, color: '#c084fc', fontWeight: 600 }}>{value}</code>
                  </div>
                ))}
              </div>
            </div>

            {/* DB URL */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Server URL</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(30,45,74,0.6)', borderRadius: 8, padding: '8px 12px' }}>
                <span style={{ fontSize: 14 }}>🔗</span>
                <code style={{ fontSize: 12, color: '#7dd3fc', flex: 1 }}>{ADMIN_DB_URL}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(ADMIN_DB_URL); toast.success('URL copied!'); }}
                  style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>
                  Copy
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                onClick={handleAdminAccess}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  border: 'none', borderRadius: 8, padding: '10px 14px',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(168,85,247,0.3)', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(168,85,247,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 15px rgba(168,85,247,0.3)'; }}
              >
                🛢️ Open DB Admin
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText('spendwise@admin123'); toast.success('Password copied!'); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)',
                  borderRadius: 8, padding: '10px 14px',
                  color: '#c084fc', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(168,85,247,0.1)'}
              >
                📋 Copy Password
              </button>
            </div>

            <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              🔒 Protected — requires admin credentials · Dev mode only
            </p>
          </div>
        )}
      </div>

      {/* Floating quick-access badge */}
      <a
        href={ADMIN_DB_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed', bottom: 24, right: 24,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(15,22,41,0.95)', border: '1px solid rgba(168,85,247,0.4)',
          borderRadius: 50, padding: '10px 18px',
          color: '#c084fc', fontSize: 13, fontWeight: 600, textDecoration: 'none',
          boxShadow: '0 8px 30px rgba(168,85,247,0.2)',
          backdropFilter: 'blur(10px)', transition: 'all 0.2s', zIndex: 1000,
          animation: 'fadeIn 0.5s ease 1s both',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,22,41,0.95)'; e.currentTarget.style.transform = ''; }}
        title="Open Server Admin Panel"
      >
        <span>🛢️</span> Server Admin
      </a>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
