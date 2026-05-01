const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(dbDir, 'expense_tracker.db'),
  logging: false,
});

// ─── User Model ──────────────────────────────────────────────
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  avatar: { type: DataTypes.STRING, defaultValue: null },
  currency: { type: DataTypes.STRING, defaultValue: 'INR' },
  monthlyBudget: { type: DataTypes.FLOAT, defaultValue: 0 },
  notifyAt: { type: DataTypes.INTEGER, defaultValue: 90, comment: 'Alert when % of budget used' },
  emailNotifications: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'users', timestamps: true });

// ─── Category Model ───────────────────────────────────────────
const Category = sequelize.define('Category', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  icon: { type: DataTypes.STRING, defaultValue: '💰' },
  color: { type: DataTypes.STRING, defaultValue: '#6366f1' },
  budgetLimit: { type: DataTypes.FLOAT, defaultValue: 0 },
  type: { type: DataTypes.ENUM('expense', 'income', 'both'), defaultValue: 'both' },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
  userId: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'categories', timestamps: true });

// ─── Transaction Model ────────────────────────────────────────
const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  type: { type: DataTypes.ENUM('income', 'expense'), allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false, validate: { min: 0.01 } },
  description: { type: DataTypes.STRING, allowNull: false },
  merchant: { type: DataTypes.STRING, defaultValue: null },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  notes: { type: DataTypes.TEXT, defaultValue: null },
  tags: { type: DataTypes.TEXT, defaultValue: '[]', get() { try { return JSON.parse(this.getDataValue('tags')); } catch { return []; } }, set(val) { this.setDataValue('tags', JSON.stringify(val || [])); } },
  recurring: { type: DataTypes.BOOLEAN, defaultValue: false },
  recurringPeriod: { type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'), defaultValue: null },
  userId: { type: DataTypes.UUID, allowNull: false },
  categoryId: { type: DataTypes.UUID, allowNull: false },
  importHash: { type: DataTypes.STRING, defaultValue: null, comment: 'For duplicate detection in CSV imports' },
}, { tableName: 'transactions', timestamps: true });

// ─── Budget Model ─────────────────────────────────────────────
const Budget = sequelize.define('Budget', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  month: { type: DataTypes.INTEGER, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  limit: { type: DataTypes.FLOAT, allowNull: false },
  spent: { type: DataTypes.FLOAT, defaultValue: 0 },
  userId: { type: DataTypes.UUID, allowNull: false },
  categoryId: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'budgets', timestamps: true });

// ─── Notification Model ───────────────────────────────────────
const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  type: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
  userId: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'notifications', timestamps: true });

// ─── Associations ─────────────────────────────────────────────
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Category, { foreignKey: 'userId', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Category.hasMany(Transaction, { foreignKey: 'categoryId', as: 'transactions' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(Budget, { foreignKey: 'userId', as: 'budgets' });
Budget.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Category.hasMany(Budget, { foreignKey: 'categoryId', as: 'budgets' });
Budget.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = { sequelize, User, Category, Transaction, Budget, Notification };
