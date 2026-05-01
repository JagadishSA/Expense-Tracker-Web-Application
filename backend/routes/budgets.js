const express = require('express');
const { Op } = require('sequelize');
const { Budget, Category, Transaction } = require('../database/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/budgets?month=&year=
router.get('/', protect, async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const budgets = await Budget.findAll({
      where: { userId: req.user.id, month, year },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color'] }],
    });

    // Calculate actual spending for each budget
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const enriched = await Promise.all(budgets.map(async (b) => {
      const txs = await Transaction.findAll({
        where: { userId: req.user.id, categoryId: b.categoryId, type: 'expense', date: { [Op.between]: [startDate, endDate] } },
      });
      const spent = txs.reduce((s, t) => s + t.amount, 0);
      const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
      return { ...b.toJSON(), spent, percentage: Math.min(pct, 100) };
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch budgets.' });
  }
});

// POST /api/budgets
router.post('/', protect, async (req, res) => {
  try {
    const { categoryId, limit, month, year } = req.body;
    if (!categoryId || !limit) return res.status(400).json({ success: false, message: 'categoryId and limit required.' });
    const now = new Date();
    const [budget, created] = await Budget.findOrCreate({
      where: { userId: req.user.id, categoryId, month: month || now.getMonth() + 1, year: year || now.getFullYear() },
      defaults: { limit: parseFloat(limit) }
    });
    if (!created) await budget.update({ limit: parseFloat(limit) });
    const withCat = await Budget.findByPk(budget.id, { include: [{ model: Category, as: 'category' }] });
    res.status(201).json({ success: true, data: withCat });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to set budget.' });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found.' });
    await budget.destroy();
    res.json({ success: true, message: 'Budget removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete budget.' });
  }
});

module.exports = router;
