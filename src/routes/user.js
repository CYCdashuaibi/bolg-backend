const express = require('express');
const router = express.Router();

const authenticateToken = require('../middlewares/authenticate'); // 引入认证中间件
const { encryptData } = require('../utils/encrypt');

const { User } = require('../models');

// 状态码
// 状态码
const HTTP_STATUS_CODES = require('../utils/httpStatusCodes');
const { NOT_FOUND } = HTTP_STATUS_CODES;

// 获取所有用户
router.get('/list', async (req, res) => {
	const users = await User.findAll();
	res.json({ data: users, success: true, message: '获取所有用户成功' });
});

// 获取当前用户
router.get('/profile', authenticateToken, async (req, res) => {
	const user = await User.findByPk(req.user.id);
	if (!user) {
		return res
			.status(NOT_FOUND)
			.json({ message: '用户未找到', success: false });
	}
	delete user.password;
	res.json({
		data: encryptData(user),
		success: true,
		message: '获取当前用户成功',
	});
});

// 获取单个用户
router.get('/:id', async (req, res) => {
	const user = await User.findByPk(req.params.id);
	if (!user) {
		return res
			.status(NOT_FOUND)
			.json({ message: '用户未找到', success: false });
	}
	res.json({ data: user, success: true, message: '获取单个用户成功' });
});

module.exports = router;
