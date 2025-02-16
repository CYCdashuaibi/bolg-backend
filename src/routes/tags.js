const express = require('express');
const router = express.Router();

const { Tag } = require('../models');

// 状态码
const HTTP_STATUS_CODES = require('../utils/httpStatusCodes');
const { INTERNAL_SERVER_ERROR } = HTTP_STATUS_CODES;

// 获取所有标签
router.get('/list', async (req, res) => {
    try {
        const tags = await Tag.findAll();
        res.json({ data: tags, success: true, message: '获取所有标签成功' });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).json({ error: err.message, success: false });
    }
});

// 创建标签
router.post('/create', async (req, res) => {
    const { name } = req.body;

    try {
        const tag = await Tag.create({ name });
        res.json({ data: tag, success: true, message: '创建标签成功' });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).json({ error: err.message, success: false });
    }
});

module.exports = router;
