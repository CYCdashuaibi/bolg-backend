const express = require('express');
const { Tag, Category } = require('../models');
const router = express.Router();

// 获取所有标签
router.get('/', async (req, res) => {
    try {
        const tags = await Tag.findAll({ include: { model: Category, as: 'category' } });
        res.json(tags);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 创建标签
router.post('/', async (req, res) => {
    const { name, category_id } = req.body;

    try {
        const tag = await Tag.create({ name, category_id });
        res.json(tag);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
