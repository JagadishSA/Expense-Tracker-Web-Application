const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const crypto = require('crypto');
const csv = require('csv-parser');
const fs = require('fs');
const multer = require('multer');
const { Transaction, Category, User, Budget, Notification } = require('../database/db');
const { protect } = require('../middleware/auth');
const { checkBudgetAlert } = require('../services/budgetAlert');

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/transactions - with filters, pagination, sort
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1, limit = 20, type, categoryId, startDate, endDate,
      search, minAmount, maxAmount, sort = 'date', order = 'DESC'
    } = req.query;

    const where = { userId: req.user.id };
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }
    if (search) where.description = { [Op.like]: `%${search}%` };
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount[Op.gte] = parseFloat(minAmount);
      if (maxAmount) where.amount[Op.lte] = parseFloat(maxAmount);
    }

    const validSorts = ['date', 'amount', 'createdAt'];
    const sortCol = validSorts.includes(sort) ? sort : 'date';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color'] }],
      order: [[sortCol, sortOrder]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)), limit: parseInt(limit) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions.' });
  }
});

// POST /api/transactions
router.post('/', protect, async (req, res) => {
  try {
    const { type, amount, description, merchant, date, categoryId, notes, tags, recurring, recurringPeriod } = req.body;
    if (!type || !amount || !description || !date || !categoryId) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    const tx = await Transaction.create({
      type, amount: parseFloat(amount), description, merchant, date, categoryId,
      notes, tags, recurring, recurringPeriod, userId: req.user.id
    });
    // Budget alert check
    if (type === 'expense') await checkBudgetAlert(req.user.id, categoryId);

    const txWithCat = await Transaction.findByPk(tx.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color'] }]
    });
    res.status(201).json({ success: true, data: txWithCat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create transaction.' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const tx = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    const { type, amount, description, merchant, date, categoryId, notes, tags, recurring, recurringPeriod } = req.body;
    await tx.update({ type, amount: parseFloat(amount), description, merchant, date, categoryId, notes, tags, recurring, recurringPeriod });
    const updated = await Transaction.findByPk(tx.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color'] }]
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update transaction.' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const tx = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    await tx.destroy();
    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete transaction.' });
  }
});

// POST /api/transactions/import - CSV Import
router.post('/import', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const results = [];
    const duplicates = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', async () => {
        fs.unlinkSync(req.file.path);
        let imported = 0;
        const categories = await Category.findAll({
          where: { [Op.or]: [{ userId: req.user.id }, { isDefault: true }] }
        });
        const catMap = {};
        categories.forEach(c => { catMap[c.name.toLowerCase()] = c.id; });

        for (const row of results) {
          try {
            const hash = crypto.createHash('md5')
              .update(`${row.date}${row.amount}${row.description}${req.user.id}`)
              .digest('hex');
            const dup = await Transaction.findOne({ where: { importHash: hash, userId: req.user.id } });
            if (dup) { duplicates.push(row); continue; }

            const catId = catMap[row.category?.toLowerCase()] || catMap['other'];
            if (!catId) { errors.push({ row, reason: 'Category not found' }); continue; }

            await Transaction.create({
              type: row.type?.toLowerCase() || 'expense',
              amount: parseFloat(row.amount),
              description: row.description || 'Imported',
              date: row.date,
              categoryId: catId,
              userId: req.user.id,
              importHash: hash,
              notes: row.notes || null,
            });
            imported++;
          } catch (e) { errors.push({ row, reason: e.message }); }
        }
        res.json({ success: true, imported, duplicates: duplicates.length, errors: errors.length });
      });
  } catch (err) {
    res.status(500).json({ success: false, message: 'CSV import failed.' });
  }
});

// GET /api/transactions/summary - Dashboard stats
router.get('/summary', protect, async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const txs = await Transaction.findAll({
      where: { userId: req.user.id, date: { [Op.between]: [startDate, endDate] } },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color'] }],
    });

    const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // Category breakdown
    const catBreakdown = {};
    txs.filter(t => t.type === 'expense').forEach(t => {
      const key = t.category?.id;
      if (!catBreakdown[key]) catBreakdown[key] = { category: t.category, amount: 0, count: 0 };
      catBreakdown[key].amount += t.amount;
      catBreakdown[key].count++;
    });

    // Daily trend (last 30 days)
    const dailyMap = {};
    txs.forEach(t => {
      if (!dailyMap[t.date]) dailyMap[t.date] = { date: t.date, income: 0, expense: 0 };
      dailyMap[t.date][t.type] += t.amount;
    });
    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Top transactions
    const topExpenses = txs.filter(t => t.type === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 5);

    res.json({
      success: true,
      data: {
        totalIncome, totalExpense, balance, month, year,
        categoryBreakdown: Object.values(catBreakdown).sort((a, b) => b.amount - a.amount),
        dailyTrend,
        topExpenses,
        transactionCount: txs.length,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to generate summary.' });
  }
});

// GET /api/transactions/yearly - yearly trend
router.get('/yearly', protect, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const txs = await Transaction.findAll({
      where: { userId: req.user.id, date: { [Op.between]: [`${year}-01-01`, `${year}-12-31`] } },
    });
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 }));
    txs.forEach(t => {
      const m = parseInt(t.date.split('-')[1]) - 1;
      monthlyData[m][t.type] += t.amount;
    });
    res.json({ success: true, data: monthlyData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch yearly data.' });
  }
});

// GET /api/transactions/autocomplete?q=keyword
router.get('/autocomplete', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });
    const txs = await Transaction.findAll({
      where: { userId: req.user.id, description: { [Op.like]: `%${q}%` } },
      attributes: ['description', 'merchant', 'categoryId'],
      group: ['description'],
      limit: 8,
    });
    res.json({ success: true, data: txs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Autocomplete failed.' });
  }
});

module.exports = router;
