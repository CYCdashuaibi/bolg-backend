const express = require('express');
const router = express.Router();

const { Category } = require('../models');

// 状态码
const HTTP_STATUS_CODES = require('../utils/httpStatusCodes');
const { INTERNAL_SERVER_ERROR } = HTTP_STATUS_CODES;

// 获取所有分类
router.get('/list', async (req, res) => {
	try {
		const categories = await Category.findAll();
		res.json({
			data: categories,
			success: true,
			message: '获取所有分类成功',
		});
	} catch (err) {
		res.status(INTERNAL_SERVER_ERROR).json({
			error: err.message,
			success: false,
		});
	}
});

// 创建分类
router.post('/create', async (req, res) => {
	const { name, alias, description, parent_id } = req.body;

	try {
		const category = await Category.create({
			name,
			alias,
			description,
			parent_id,
		});
		res.json({ data: category, success: true, message: '创建分类成功' });
	} catch (err) {
		res.status(INTERNAL_SERVER_ERROR).json({
			error: err.message,
			success: false,
		});
	}
});

module.exports = router;
