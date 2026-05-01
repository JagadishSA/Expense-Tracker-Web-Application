import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '📊', title: 'Real-time Analytics', desc: 'Interactive charts and graphs showing your spending patterns and financial health at a glance.' },
  { icon: '🎯', title: 'Smart Budget Tracking', desc: 'Set category-wise budget limits and get instant alerts when you approach your thresholds.' },
  { icon: '🔔', title: 'Automated Alerts', desc: 'Email and in-app notifications when you hit 90% of any budget limit – never overspend again.' },
  { icon: '📁', title: 'CSV Bulk Import', desc: 'Import hundreds of transactions at once with automatic duplicate detection and smart categorization.' },
  { icon: '🔒', title: 'Secure & Private', desc: 'Bank-grade encryption with JWT authentication ensures your financial data stays yours alone.' },
  { icon: '📱', title: 'Fully Responsive', desc: 'Works seamlessly on mobile, tablet, and desktop for tracking anywhere, anytime.' },
];

export default function LandingPage() {
  return (
    <div className="landing-hero">
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div className="hero-badge">✨ Smart Financial Management</div>
        <h1 className="hero-title">
          Take Control of Your <br />
          <span className="gradient">Financial Future</span>
        </h1>
        <p className="hero-desc">
          Track expenses, set budgets, visualize spending patterns, and achieve your financial goals with SpendWise – your intelligent personal finance companion.
        </p>
        <div className="hero-btns">
          <Link to="/register" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
            🚀 Get Started Free
          </Link>
          <Link to="/login" className="btn btn-secondary" style={{ fontSize: 16, padding: '14px 28px' }}>
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 40, marginBottom: 60, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['₹ Multi-currency', 'Support'], ['18+', 'Categories'], ['Real-time', 'Analytics'], ['100%', 'Secure']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{v}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* SDG Note */}
        <div style={{ marginTop: 48, padding: '20px 28px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', maxWidth: 700, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            🌍 <strong style={{ color: 'var(--accent)' }}>Aligned with UN Sustainable Development Goals</strong><br />
            Promoting financial literacy (SDG 4), economic growth (SDG 8), and responsible consumption (SDG 12) through smart personal finance management.
          </div>
        </div>
      </div>
    </div>
  );
}
