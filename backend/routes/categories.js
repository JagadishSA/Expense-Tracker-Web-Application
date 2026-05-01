const express = require('express');
const { Op } = require('sequelize');
const { Category } = require('../database/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories
router.get('/', protect, async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { [Op.or]: [{ userId: req.user.id }, { isDefault: true, userId: null }] },
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

// POST /api/categories
router.post('/', protect, async (req, res) => {
  try {
    const { name, icon, color, type, budgetLimit } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });
    const cat = await Category.create({ name, icon, color, type, budgetLimit, userId: req.user.id, isDefault: false });
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
});

// PUT /api/categories/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const cat = await Category.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found or not editable.' });
    const { name, icon, color, type, budgetLimit } = req.body;
    await cat.update({ name, icon, color, type, budgetLimit });
    res.json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const cat = await Category.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found or not deletable.' });
    await cat.destroy();
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
});

module.exports = router;
