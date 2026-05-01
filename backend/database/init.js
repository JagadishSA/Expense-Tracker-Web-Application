const { sequelize, Category } = require('./db');

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍽️', color: '#f97316', type: 'expense', isDefault: true },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6', type: 'expense', isDefault: true },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense', isDefault: true },
  { name: 'Entertainment', icon: '🎬', color: '#8b5cf6', type: 'expense', isDefault: true },
  { name: 'Healthcare', icon: '🏥', color: '#10b981', type: 'expense', isDefault: true },
  { name: 'Housing & Rent', icon: '🏠', color: '#f59e0b', type: 'expense', isDefault: true },
  { name: 'Utilities', icon: '💡', color: '#06b6d4', type: 'expense', isDefault: true },
  { name: 'Education', icon: '📚', color: '#6366f1', type: 'expense', isDefault: true },
  { name: 'Travel', icon: '✈️', color: '#14b8a6', type: 'expense', isDefault: true },
  { name: 'Subscriptions', icon: '📱', color: '#a855f7', type: 'expense', isDefault: true },
  { name: 'Personal Care', icon: '💆', color: '#f43f5e', type: 'expense', isDefault: true },
  { name: 'Investments', icon: '📈', color: '#22c55e', type: 'expense', isDefault: true },
  { name: 'Salary', icon: '💼', color: '#10b981', type: 'income', isDefault: true },
  { name: 'Freelance', icon: '💻', color: '#6366f1', type: 'income', isDefault: true },
  { name: 'Business', icon: '🏢', color: '#f59e0b', type: 'income', isDefault: true },
  { name: 'Investments Return', icon: '📊', color: '#22c55e', type: 'income', isDefault: true },
  { name: 'Gift / Bonus', icon: '🎁', color: '#ec4899', type: 'income', isDefault: true },
  { name: 'Other', icon: '📌', color: '#6b7280', type: 'both', isDefault: true },
];

async function initDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    // Seed default categories (no userId = global)
    for (const cat of DEFAULT_CATEGORIES) {
      await Category.findOrCreate({ where: { name: cat.name, isDefault: true, userId: null }, defaults: cat });
    }
    console.log('✅ Database synced and seeded successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

module.exports = { initDatabase };
