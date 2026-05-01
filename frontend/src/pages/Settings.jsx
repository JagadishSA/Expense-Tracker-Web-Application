import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import toast from 'react-hot-toast';

const CURRENCIES = ['INR','USD','EUR','GBP','JPY','AUD','CAD','SGD'];

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    currency: user?.currency || 'INR',
    monthlyBudget: user?.monthlyBudget || '',
    notifyAt: user?.notifyAt || 90,
    emailNotifications: user?.emailNotifications ?? true,
  });
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [tab, setTab] = useState('profile');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.put('/auth/profile', profile);
      updateUser(res.data.user);
      toast.success('Profile updated! ✅');
    } catch { toast.error('Failed to update profile.'); }
    finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match!'); return; }
    setPwLoading(true);
    try {
      await API.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed! 🔐');
      setPwForm({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password.'); }
    finally { setPwLoading(false); }
  };

  const tabs = [
    { id:'profile', label:'👤 Profile', },
    { id:'security', label:'🔐 Security', },
    { id:'notifications', label:'🔔 Notifications', },
    { id:'about', label:'ℹ️ About', },
  ];

  return (
    <div style={{ maxWidth:700 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Settings</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:4 }}>
        {tabs.map(t => (
          <button key={t.id} className={`btn${tab === t.id ? ' btn-primary' : ' btn-secondary'}`} style={{ flex:1, justifyContent:'center', padding:'8px 12px', fontSize:13 }}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="card">
          <div className="card-title">👤 Profile Information</div>
          <form onSubmit={handleProfileSave}>
            <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:24 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--gradient)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:700 }}>
                {user?.name?.slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:700 }}>{user?.name}</div>
                <div style={{ color:'var(--text-muted)', fontSize:13 }}>{user?.email}</div>
                <div style={{ fontSize:12, color:'var(--accent)', marginTop:4 }}>Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-select" value={profile.currency} onChange={e => setProfile(p => ({...p, currency: e.target.value}))}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Budget Limit</label>
                <input className="form-input" type="number" min="0" placeholder="e.g., 50000" value={profile.monthlyBudget}
                  onChange={e => setProfile(p => ({...p, monthlyBudget: e.target.value}))} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Saving...' : '✅ Save Profile'}
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="card">
          <div className="card-title">🔐 Change Password</div>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({...p, currentPassword: e.target.value}))} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" placeholder="Min 6 chars" value={pwForm.newPassword} onChange={e => setPwForm(p => ({...p, newPassword: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password" placeholder="Repeat new password" value={pwForm.confirm} onChange={e => setPwForm(p => ({...p, confirm: e.target.value}))} required />
              </div>
            </div>
            <div style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'var(--text-muted)' }}>
              🔒 Passwords are hashed using bcrypt with 12 salt rounds for maximum security.
            </div>
            <button type="submit" className="btn btn-primary" disabled={pwLoading}>
              {pwLoading ? '⏳ Changing...' : '🔐 Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div className="card">
          <div className="card-title">🔔 Notification Preferences</div>
          <div className="form-group">
            <label style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
              <input type="checkbox" checked={profile.emailNotifications} onChange={e => setProfile(p => ({...p, emailNotifications: e.target.checked}))} style={{ width:18, height:18 }} />
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>Email Notifications</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>Receive budget alert emails when thresholds are exceeded</div>
              </div>
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Alert Threshold: {profile.notifyAt}% of budget used</label>
            <input type="range" min="50" max="100" step="5" value={profile.notifyAt}
              onChange={e => setProfile(p => ({...p, notifyAt: +e.target.value}))}
              style={{ width:'100%', accentColor:'var(--accent)', marginTop:8 }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
              <span>50%</span><span>75%</span><span>90%</span><span>100%</span>
            </div>
          </div>
          <div style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'var(--text-muted)' }}>
            📧 Configure your Gmail SMTP credentials in the backend <code style={{ color:'var(--accent)' }}>.env</code> file to enable email alerts.
          </div>
          <button className="btn btn-primary" onClick={handleProfileSave} disabled={loading}>
            {loading ? '⏳ Saving...' : '✅ Save Preferences'}
          </button>
        </div>
      )}

      {/* About Tab */}
      {tab === 'about' && (
        <div className="card">
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>💰</div>
            <h2 style={{ fontWeight:800, fontSize:24, background:'var(--gradient)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:8 }}>SpendWise</h2>
            <p style={{ color:'var(--text-muted)', marginBottom:24 }}>Personal Finance & Expense Tracker v1.0</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, textAlign:'left', marginBottom:24 }}>
              {[['Frontend','React + Vite + Recharts'],['Backend','Node.js + Express.js'],['Database','SQLite via Sequelize'],['Auth','JWT + bcrypt'],['Charts','Recharts'],['SDG Aligned','Goals 1,4,8,9,10,12']].map(([k,v]) => (
                <div key={k} style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'10px 14px' }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1 }}>{k}</div>
                  <div style={{ fontSize:13, fontWeight:600, marginTop:2 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.7 }}>
              🌍 Built to align with <strong style={{ color:'var(--accent)' }}>UN Sustainable Development Goals</strong><br />
              Promoting financial literacy, responsible consumption, and economic empowerment.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
