const { Op } = require('sequelize');
const { Transaction, Budget, Category, User, Notification } = require('../database/db');
const nodemailer = require('nodemailer');

const getTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function sendBudgetAlertEmail(user, category, spent, limit, percentage) {
  try {
    if (!user.emailNotifications || !process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') return;
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `⚠️ Budget Alert: ${category.name} at ${percentage}%`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
          <h2 style="color:#f97316;">⚠️ Budget Alert!</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>You've used <strong style="color:#f97316;">${percentage}%</strong> of your <strong>${category.name}</strong> budget.</p>
          <div style="background:#1e293b;border-radius:8px;padding:16px;margin:16px 0;">
            <p>💰 Budget Limit: <strong>${user.currency} ${limit.toFixed(2)}</strong></p>
            <p>💸 Amount Spent: <strong style="color:#ef4444;">${user.currency} ${spent.toFixed(2)}</strong></p>
            <p>✅ Remaining: <strong style="color:#22c55e;">${user.currency} ${(limit - spent).toFixed(2)}</strong></p>
          </div>
          <p style="color:#94a3b8;font-size:14px;">Review your expenses in the <a href="http://localhost:5173" style="color:#6366f1;">Expense Tracker Dashboard</a>.</p>
        </div>
      `,
    });
  } catch (e) {
    console.warn('Email sending failed (configure EMAIL_USER/EMAIL_PASS in .env):', e.message);
  }
}

async function checkBudgetAlert(userId, categoryId) {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const budget = await Budget.findOne({ where: { userId, categoryId, month, year } });
    if (!budget || budget.limit <= 0) return;

    const txs = await Transaction.findAll({
      where: { userId, categoryId, type: 'expense', date: { [Op.between]: [startDate, endDate] } },
    });
    const spent = txs.reduce((s, t) => s + t.amount, 0);
    const percentage = Math.round((spent / budget.limit) * 100);

    const user = await User.findByPk(userId);
    const category = await Category.findByPk(categoryId);
    const threshold = user.notifyAt || 90;

    if (percentage >= threshold) {
      // Create in-app notification
      const existingNote = await Notification.findOne({
        where: {
          userId,
          type: 'budget_alert',
          message: { [Op.like]: `%${category.name}%` },
          createdAt: { [Op.gte]: new Date(year, month - 1, 1) },
          read: false
        }
      });

      if (!existingNote) {
        await Notification.create({
          userId,
          type: 'budget_alert',
          title: `Budget Alert: ${category.name}`,
          message: `You've used ${percentage}% of your ${category.name} budget (${user.currency} ${spent.toFixed(2)} / ${budget.limit.toFixed(2)}).`,
        });
        await sendBudgetAlertEmail(user, category, spent, budget.limit, percentage);
      }
    }
  } catch (err) {
    console.error('Budget alert error:', err.message);
  }
}

module.exports = { checkBudgetAlert };
