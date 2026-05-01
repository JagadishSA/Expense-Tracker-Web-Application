import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

const NAV = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/transactions', icon: '💳', label: 'Transactions' },
  { path: '/budgets', icon: '🎯', label: 'Budgets' },
  { path: '/reports', icon: '📈', label: 'Reports' },
  { path: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.data);
      setUnread(res.data.unread);
    } catch {}
  };

  const markAllRead = async () => {
    try { await API.put('/notifications/read-all'); fetchNotifications(); } catch {}
  };

  const getTitle = () => {
    const found = NAV.find(n => location.pathname.startsWith(n.path));
    return found ? found.label : 'Expense Tracker';
  };

  const handleLogout = () => { logout(); navigate('/'); };
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">💰</div>
          <span>SpendWise</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">Main Menu</div>
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="name">{user?.name}</div>
            <div className="email">{user?.email}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">⏻</button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ display: 'none', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)' }}
              className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div>
              <div className="topbar-title">{getTitle()}</div>
            </div>
          </div>
          <div className="topbar-actions">
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button className="notif-btn" onClick={() => setShowNotif(!showNotif)}>
                🔔
                {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
              </button>
              {showNotif && (
                <div className="notif-panel">
                  <div className="notif-header">
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications {unread > 0 && <span className="badge badge-expense" style={{ marginLeft: 6 }}>{unread} new</span>}</span>
                    {unread > 0 && <button className="btn btn-sm" style={{ padding: '4px 10px', fontSize: 12 }} onClick={markAllRead}>Mark all read</button>}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>🎉 All caught up!</div>
                  ) : notifications.slice(0, 10).map(n => (
                    <div key={n.id} className={`notif-item${!n.read ? ' unread' : ''}`}>
                      {!n.read && <div className="notif-dot" />}
                      <div className="notif-body" style={{ paddingLeft: n.read ? 20 : 0 }}>
                        <div className="title">{n.title}</div>
                        <div className="msg">{n.message}</div>
                        <div className="time">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
