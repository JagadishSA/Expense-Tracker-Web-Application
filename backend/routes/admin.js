/**
 * DB Admin Panel with Session-based Login
 * Routes:
 *   GET  /api/admin/db       → Login page (if not authenticated) OR DB viewer
 *   POST /api/admin/login    → Process login form
 *   GET  /api/admin/logout   → Logout and redirect to login
 *   POST /api/admin/query    → Run SQL (authenticated only)
 */
const express = require('express');
const { sequelize } = require('../database/db');
const router = express.Router();

// ─── Auth Guard ───────────────────────────────────────────────
const requireAdminAuth = (req, res, next) => {
  if (req.session && req.session.adminLoggedIn) return next();
  res.redirect('/api/admin/db');
};

// ─── Shared Styles ────────────────────────────────────────────
const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#0a0e1a; color:#e2e8f0; min-height:100vh; }
  ::-webkit-scrollbar { width:6px; height:6px; }
  ::-webkit-scrollbar-track { background:#0a0e1a; }
  ::-webkit-scrollbar-thumb { background:#1e2d4a; border-radius:3px; }
`;

// ─── LOGIN PAGE ───────────────────────────────────────────────
const renderLogin = (error = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SpendWise DB Admin – Login</title>
  <style>
    ${SHARED_CSS}
    body { display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; }
    body::before {
      content:''; position:absolute; width:700px; height:700px;
      background:radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%);
      top:50%; left:50%; transform:translate(-50%,-50%); border-radius:50%; pointer-events:none;
    }
    .card {
      background:#151d35; border:1px solid #1e2d4a; border-radius:20px;
      padding:44px 40px; width:100%; max-width:420px; position:relative; z-index:1;
      box-shadow:0 20px 60px rgba(0,0,0,0.6);
    }
    .logo { display:flex; align-items:center; gap:14px; margin-bottom:36px; }
    .logo-icon {
      width:52px; height:52px; border-radius:14px;
      background:linear-gradient(135deg,#6366f1,#a855f7);
      display:flex; align-items:center; justify-content:center; font-size:26px; flex-shrink:0;
    }
    .logo-text h1 { font-size:20px; font-weight:800; background:linear-gradient(135deg,#6366f1,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .logo-text p { font-size:12px; color:#64748b; margin-top:2px; }
    h2 { font-size:24px; font-weight:800; margin-bottom:6px; }
    .sub { font-size:14px; color:#64748b; margin-bottom:28px; }
    .badge {
      display:inline-flex; align-items:center; gap:6px; background:rgba(239,68,68,0.12);
      border:1px solid rgba(239,68,68,0.3); color:#ef4444; border-radius:8px;
      padding:8px 14px; font-size:13px; margin-bottom:20px; width:100%;
    }
    label { display:block; font-size:12px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; }
    .input-wrap { position:relative; margin-bottom:16px; }
    .input-wrap .icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:16px; }
    input[type=text], input[type=password] {
      width:100%; background:#0a0e1a; border:1px solid #1e2d4a; border-radius:10px;
      padding:12px 14px 12px 40px; color:#e2e8f0; font-size:14px; font-family:inherit;
      outline:none; transition:all 0.2s;
    }
    input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,0.2); }
    input::placeholder { color:#64748b; }
    .btn {
      width:100%; padding:13px; border-radius:10px; font-size:15px; font-weight:700;
      background:linear-gradient(135deg,#6366f1,#a855f7); color:#fff; border:none;
      cursor:pointer; margin-top:8px; transition:all 0.2s; font-family:inherit;
      box-shadow:0 4px 20px rgba(99,102,241,0.3);
    }
    .btn:hover { opacity:0.9; transform:translateY(-1px); box-shadow:0 6px 25px rgba(99,102,241,0.4); }
    .btn:active { transform:translateY(0); }
    .footer { margin-top:24px; text-align:center; font-size:12px; color:#64748b; }
    .footer span { color:#6366f1; font-weight:600; }
  </style>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="logo-icon">💰</div>
    <div class="logo-text">
      <h1>SpendWise</h1>
      <p>Database Admin Panel</p>
    </div>
  </div>
  <h2>Admin Sign In</h2>
  <p class="sub">Enter your credentials to access the database</p>
  ${error ? `<div class="badge">⚠️ ${error}</div>` : ''}
  <form method="POST" action="/api/admin/login">
    <div>
      <label>Username</label>
      <div class="input-wrap">
        <span class="icon">👤</span>
        <input type="text" name="username" placeholder="admin" autocomplete="username" required autofocus />
      </div>
    </div>
    <div>
      <label>Password</label>
      <div class="input-wrap">
        <span class="icon">🔐</span>
        <input type="password" name="password" placeholder="••••••••••••" autocomplete="current-password" required />
      </div>
    </div>
    <button type="submit" class="btn">🚀 Sign In to Admin Panel</button>
  </form>
  <div class="footer">Protected route — <span>Development Mode</span> only</div>
</div>
</body>
</html>`;

// ─── DB VIEWER PAGE ───────────────────────────────────────────
const renderViewer = async () => {
  const [tables] = await sequelize.query(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
  );
  let tableData = {};
  for (const { name } of tables) {
    const [rows] = await sequelize.query(`SELECT * FROM "${name}" LIMIT 200`);
    const [cols] = await sequelize.query(`PRAGMA table_info("${name}")`);
    tableData[name] = { rows, cols };
  }
  const totalRows = Object.values(tableData).reduce((s, t) => s + t.rows.length, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SpendWise DB Admin</title>
  <style>
    ${SHARED_CSS}
    header {
      background:#0f1629; border-bottom:1px solid #1e2d4a;
      padding:0 24px; height:56px; display:flex; align-items:center;
      justify-content:space-between; position:sticky; top:0; z-index:100;
    }
    .header-left { display:flex; align-items:center; gap:14px; }
    .header-logo { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#6366f1,#a855f7); display:flex; align-items:center; justify-content:center; font-size:18px; }
    .header-title { font-size:16px; font-weight:700; background:linear-gradient(135deg,#6366f1,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .header-meta { font-size:12px; color:#64748b; }
    .header-right { display:flex; align-items:center; gap:10px; }
    .header-stats { display:flex; gap:16px; }
    .stat-pill { background:#151d35; border:1px solid #1e2d4a; border-radius:20px; padding:4px 14px; font-size:12px; color:#94a3b8; }
    .stat-pill strong { color:#6366f1; }
    .btn-logout {
      background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#ef4444;
      border-radius:8px; padding:6px 16px; font-size:13px; font-weight:600; cursor:pointer;
      font-family:inherit; transition:all 0.2s; text-decoration:none; display:inline-flex; align-items:center; gap:6px;
    }
    .btn-logout:hover { background:rgba(239,68,68,0.2); }
    .btn-refresh {
      background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); color:#6366f1;
      border-radius:8px; padding:6px 14px; font-size:13px; font-weight:600; cursor:pointer;
      font-family:inherit; transition:all 0.2s;
    }
    .btn-refresh:hover { background:rgba(99,102,241,0.2); }
    .layout { display:flex; height:calc(100vh - 56px); }
    /* Sidebar */
    .sidebar { width:220px; background:#0f1629; border-right:1px solid #1e2d4a; overflow-y:auto; flex-shrink:0; }
    .sidebar-section { padding:12px; }
    .sidebar-label { font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:1.5px; padding:8px 8px 4px; }
    .table-btn {
      display:flex; align-items:center; justify-content:space-between;
      width:100%; padding:9px 12px; border-radius:8px;
      background:none; border:none; color:#94a3b8; font-size:13px;
      font-family:inherit; text-align:left; cursor:pointer; transition:all 0.15s; margin-bottom:2px;
    }
    .table-btn:hover { background:rgba(99,102,241,0.08); color:#c4b5fd; }
    .table-btn.active { background:rgba(99,102,241,0.15); color:#a5b4fc; font-weight:600; }
    .table-btn .tname { display:flex; align-items:center; gap:8px; }
    .table-btn .count { background:#1e2d4a; border-radius:10px; padding:2px 8px; font-size:11px; color:#64748b; flex-shrink:0; }
    .table-btn.active .count { background:rgba(99,102,241,0.2); color:#6366f1; }
    /* Main */
    .main { flex:1; overflow:auto; }
    .table-section { display:none; flex-direction:column; }
    .table-section.active { display:flex; }
    .section-header { padding:20px 24px 16px; border-bottom:1px solid #1e2d4a; display:flex; align-items:center; justify-content:space-between; background:#0f1629; position:sticky; top:0; z-index:10; }
    .section-title { font-size:20px; font-weight:800; display:flex; align-items:center; gap:10px; }
    .section-meta { font-size:13px; color:#64748b; margin-top:2px; }
    .section-body { padding:20px 24px; }
    /* Schema */
    .schema-block { background:#0f1629; border:1px solid #1e2d4a; border-radius:12px; margin-bottom:20px; overflow:hidden; }
    .schema-title { padding:12px 16px; border-bottom:1px solid #1e2d4a; font-size:11px; font-weight:700; color:#6366f1; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:6px; }
    .schema-table { width:100%; border-collapse:collapse; font-size:12px; }
    .schema-table th { padding:8px 16px; text-align:left; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid rgba(30,45,74,0.6); background:#0a0e1a; }
    .schema-table td { padding:8px 16px; border-bottom:1px solid rgba(30,45,74,0.4); color:#94a3b8; }
    .schema-table tr:last-child td { border-bottom:none; }
    .schema-table td:first-child { color:#e2e8f0; font-weight:600; font-family:monospace; }
    td.type { color:#06b6d4; font-family:monospace; font-size:11px; }
    /* Data table */
    .data-wrap { border:1px solid #1e2d4a; border-radius:12px; overflow:auto; margin-bottom:20px; max-height:420px; }
    .data-table { width:100%; border-collapse:collapse; font-size:13px; }
    .data-table thead { position:sticky; top:0; z-index:5; }
    .data-table thead tr { background:#0a0e1a; }
    .data-table th { padding:10px 14px; text-align:left; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #1e2d4a; white-space:nowrap; }
    .data-table tbody tr { border-bottom:1px solid rgba(30,45,74,0.5); transition:background 0.1s; }
    .data-table tbody tr:last-child { border-bottom:none; }
    .data-table tbody tr:hover { background:rgba(99,102,241,0.04); }
    .data-table td { padding:9px 14px; color:#94a3b8; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .data-table td.id-col { color:#6366f1; font-family:monospace; font-size:11px; }
    .null-val { color:#334155; font-style:italic; font-size:11px; }
    .bool-t { color:#22c55e; font-weight:600; }
    .bool-f { color:#ef4444; font-weight:600; }
    /* Badges */
    .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; }
    .badge-pk { background:rgba(99,102,241,0.2); color:#a5b4fc; }
    .badge-nn { background:rgba(239,68,68,0.15); color:#fca5a5; font-size:10px; }
    .badge-null { background:rgba(100,116,139,0.15); color:#94a3b8; font-size:10px; }
    /* SQL Editor */
    .sql-block { background:#0f1629; border:1px solid #1e2d4a; border-radius:12px; overflow:hidden; }
    .sql-title { padding:12px 16px; border-bottom:1px solid #1e2d4a; font-size:11px; font-weight:700; color:#a855f7; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:6px; }
    .sql-body { padding:16px; }
    textarea {
      width:100%; background:#0a0e1a; border:1px solid #1e2d4a; border-radius:8px;
      padding:12px 14px; color:#e2e8f0; font-family:'Fira Code',monospace; font-size:13px;
      line-height:1.6; resize:vertical; outline:none; min-height:80px; transition:border-color 0.2s;
    }
    textarea:focus { border-color:#6366f1; box-shadow:0 0 0 2px rgba(99,102,241,0.15); }
    .sql-actions { display:flex; gap:8px; margin-top:10px; align-items:center; }
    .btn-run {
      background:linear-gradient(135deg,#6366f1,#a855f7); color:#fff; border:none;
      border-radius:8px; padding:8px 20px; font-size:13px; font-weight:700;
      cursor:pointer; font-family:inherit; transition:all 0.2s; display:flex; align-items:center; gap:6px;
    }
    .btn-run:hover { opacity:0.9; transform:translateY(-1px); }
    .sql-hint { font-size:12px; color:#475569; }
    .result-box { margin-top:12px; }
    .result-success { font-size:12px; color:#22c55e; margin-bottom:8px; }
    .result-error { font-size:12px; color:#ef4444; padding:10px 14px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:8px; margin-top:8px; }
    /* No data */
    .no-data { text-align:center; padding:40px; color:#475569; }
    .no-data .icon { font-size:40px; margin-bottom:10px; opacity:0.4; }
  </style>
</head>
<body>
<header>
  <div class="header-left">
    <div class="header-logo">💰</div>
    <div>
      <div class="header-title">SpendWise DB Admin</div>
      <div class="header-meta">SQLite · ${tables.length} tables · ${totalRows} total rows</div>
    </div>
  </div>
  <div class="header-right">
    <div class="header-stats">
      ${tables.map(({name}) => `<div class="stat-pill">${name} <strong>${tableData[name].rows.length}</strong></div>`).join('')}
    </div>
    <button class="btn-refresh" onclick="location.reload()">🔄 Refresh</button>
    <a class="btn-logout" href="/api/admin/logout">⏻ Logout</a>
  </div>
</header>

<div class="layout">
  <aside class="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-label">Tables</div>
      ${tables.map(({ name }) => `
      <button class="table-btn" id="btn-${name}" onclick="showTable('${name}')">
        <span class="tname">📋 ${name}</span>
        <span class="count">${tableData[name].rows.length}</span>
      </button>`).join('')}
    </div>
  </aside>

  <main class="main">
    ${tables.map(({ name }, idx) => {
      const { rows, cols } = tableData[name];
      const headers = cols.map(c => c.name);
      return `
    <div class="table-section${idx === 0 ? ' active' : ''}" id="section-${name}">
      <div class="section-header">
        <div>
          <div class="section-title">📋 ${name}</div>
          <div class="section-meta">${rows.length} rows · ${cols.length} columns${rows.length >= 200 ? ' (showing first 200)' : ''}</div>
        </div>
      </div>
      <div class="section-body">
        <!-- Schema -->
        <div class="schema-block">
          <div class="schema-title">📐 Schema</div>
          <table class="schema-table">
            <thead><tr><th>Column</th><th>Type</th><th>Constraint</th><th>Default</th><th>Key</th></tr></thead>
            <tbody>
            ${cols.map(c => `
              <tr>
                <td>${c.name}</td>
                <td class="type">${c.type || 'TEXT'}</td>
                <td>${c.notnull ? '<span class="badge badge-nn">NOT NULL</span>' : '<span class="badge badge-null">NULL</span>'}</td>
                <td style="font-family:monospace;font-size:12px">${c.dflt_value !== null ? `<span style="color:#eab308">${c.dflt_value}</span>` : '<span class="null-val">—</span>'}</td>
                <td>${c.pk ? '<span class="badge badge-pk">🔑 PK</span>' : ''}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>

        <!-- Data -->
        <div class="data-wrap">
          <table class="data-table">
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>
            ${rows.length === 0
              ? `<tr><td colspan="${headers.length}"><div class="no-data"><div class="icon">📭</div>No data in this table</div></td></tr>`
              : rows.map(row => `
              <tr>${headers.map((h, i) => {
                const val = row[h];
                const cls = i === 0 ? ' class="id-col"' : '';
                if (val === null || val === undefined) return `<td${cls}><span class="null-val">NULL</span></td>`;
                if (val === true) return `<td${cls}><span class="bool-t">✓ true</span></td>`;
                if (val === false) return `<td${cls}><span class="bool-f">✗ false</span></td>`;
                const str = String(val);
                return `<td${cls} title="${str.replace(/"/g,'&quot;')}">${str.length > 55 ? str.slice(0,55)+'…' : str}</td>`;
              }).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>

        <!-- SQL Editor -->
        <div class="sql-block">
          <div class="sql-title">🔍 Custom SQL Query</div>
          <div class="sql-body">
            <textarea id="sql-${name}">SELECT * FROM "${name}" LIMIT 20;</textarea>
            <div class="sql-actions">
              <button class="btn-run" onclick="runQuery('${name}')">▶ Run Query</button>
              <span class="sql-hint">SELECT, WHERE, ORDER BY, COUNT etc. DROP/DELETE blocked.</span>
            </div>
            <div class="result-box" id="result-${name}"></div>
          </div>
        </div>
      </div>
    </div>`;
    }).join('')}
  </main>
</div>

<script>
  // Activate first table on load
  ${tables.length > 0 ? `showTable('${tables[0].name}');` : ''}

  function showTable(name) {
    document.querySelectorAll('.table-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.table-btn').forEach(b => b.classList.remove('active'));
    const sec = document.getElementById('section-' + name);
    const btn = document.getElementById('btn-' + name);
    if (sec) sec.classList.add('active');
    if (btn) btn.classList.add('active');
    // Scroll main to top
    document.querySelector('.main').scrollTop = 0;
  }

  async function runQuery(tableName) {
    const sql = document.getElementById('sql-' + tableName).value.trim();
    const resultDiv = document.getElementById('result-' + tableName);
    if (!sql) return;
    resultDiv.innerHTML = '<p style="color:#64748b;font-size:13px;padding:8px 0">⏳ Running query...</p>';
    try {
      const res = await fetch('/api/admin/query', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ sql })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!data.rows || data.rows.length === 0) {
        resultDiv.innerHTML = '<p class="result-success">✅ Query ran successfully. No rows returned.</p>';
        return;
      }
      const headers = Object.keys(data.rows[0]);
      resultDiv.innerHTML = \`
        <p class="result-success">\${data.rows.length} row(s) returned</p>
        <div class="data-wrap" style="max-height:260px">
          <table class="data-table">
            <thead><tr>\${headers.map(h=>\`<th>\${h}</th>\`).join('')}</tr></thead>
            <tbody>\${data.rows.map(row=>\`<tr>\${headers.map(h=>{
              const v = row[h];
              if (v===null||v===undefined) return '<td><span class="null-val">NULL</span></td>';
              return \`<td title="\${String(v).replace(/"/g,'&quot;')}">\${String(v).length>55?String(v).slice(0,55)+'…':String(v)}</td>\`;
            }).join('')}</tr>\`).join('')}
            </tbody>
          </table>
        </div>\`;
    } catch(e) {
      resultDiv.innerHTML = \`<div class="result-error">❌ \${e.message}</div>\`;
    }
  }
</script>
</body>
</html>`;
};

// ─── GET /api/admin/db — show login or viewer ─────────────────
router.get('/db', async (req, res) => {
  try {
    if (!req.session || !req.session.adminLoggedIn) {
      return res.send(renderLogin());
    }
    const html = await renderViewer();
    res.send(html);
  } catch (err) {
    res.status(500).send(`<pre style="color:red;background:#0a0e1a;padding:20px">Error: ${err.message}\n${err.stack}</pre>`);
  }
});

// ─── POST /api/admin/login ────────────────────────────────────
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'admin123';

  if (username === adminUser && password === adminPass) {
    req.session.adminLoggedIn = true;
    req.session.adminUser = username;
    return res.redirect('/api/admin/db');
  }
  res.send(renderLogin('Invalid username or password. Please try again.'));
});

// ─── GET /api/admin/logout ────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/api/admin/db');
  });
});

// ─── POST /api/admin/query — authenticated SQL runner ─────────
router.post('/query', requireAdminAuth, async (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ error: 'No SQL provided.' });
    const dangerous = /^\s*(drop|delete\s+from|truncate|alter\s+table|attach|detach)/i;
    if (dangerous.test(sql)) return res.status(400).json({ error: 'Destructive SQL is blocked. Use SELECT queries only.' });
    const [rows] = await sequelize.query(sql);
    res.json({ rows, count: rows.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
