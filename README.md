# SpendWise – Smart Expense Tracker

A full-stack personal finance management web application built with **React + Node.js + SQLite**.

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
node server.js
# API runs on http://localhost:5000
```

### 2. Start Frontend (new terminal)
```bash
cd frontend
npm run dev
# UI runs on http://localhost:5173
```

### 3. Open in browser
Visit **http://localhost:5173** and register a free account.

---

## 🔑 Demo Account
After seeding, use:
- **Email:** demo@spendwise.com  
- **Password:** demo123456

Or run `seed-demo.ps1` to populate data after registering.

---

## 🏗️ Architecture (Three-Tier)

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite + Recharts + React Router |
| **Backend** | Node.js + Express.js + JWT Auth |
| **Database** | SQLite via Sequelize ORM |

---

## ✨ Features

### Module 1 – Authentication & Gateway
- Landing page with feature showcase & SDG alignment
- JWT-based registration/login with bcrypt password hashing
- Protected routes, persistent sessions

### Module 2 – Transaction Management
- Add/Edit/Delete income & expense transactions
- Smart autocomplete based on transaction history
- CSV bulk import with duplicate detection
- Recurring transaction support
- Filter by type, category, date range, amount, keyword
- Pagination

### Module 3 – Dashboard & Analytics
- Real-time stats: Income / Expense / Balance / Savings Rate
- Area chart: Daily cash flow trend
- Pie chart: Spending by category
- Top expenses list
- Category breakdown with progress bars
- Monthly & yearly reports (bar + line charts)

### Module 4 – Budget Tracking
- Set per-category monthly budget limits
- Real-time progress bars (green/yellow/red)
- Budget health indicators
- Automated in-app notifications when ≥ notifyAt%

### Module 5 – Notification System
- In-app notification bell with unread badge
- Budget alert notifications auto-created
- Email alerts via Nodemailer (configure `.env`)
- Mark all read / dismiss

---

## ⚙️ Environment Variables (`backend/.env`)

```
PORT=5000
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 📁 CSV Import Format

```
date,type,amount,description,category,notes
2024-01-15,expense,500,Coffee,Food & Dining,Morning
2024-01-16,income,50000,Salary,Salary,January
```

---

## 🌍 SDG Alignment
- **SDG 1** – No Poverty: Financial awareness & budget control  
- **SDG 4** – Quality Education: Financial literacy tools  
- **SDG 8** – Decent Work: Income tracking for freelancers  
- **SDG 9** – Industry & Innovation: Modern digital finance  
- **SDG 10** – Reduced Inequalities: Accessible for all  
- **SDG 12** – Responsible Consumption: Spending awareness  
