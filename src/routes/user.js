const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const authenticateToken = require('../middlewares/authenticate'); // 引入认证中间件
const redis = require('../config/redis');
const { encryptData } = require('../utils/encrypt');

const { User } = require('../models');

// 校验规则
const validate = require('../middlewares/validate');
const {
	updateProfileValidation,
} = require('../middlewares/validations/userValidation');

// 状态码
const HTTP_STATUS_CODES = require('../utils/httpStatusCodes');
const { NOT_FOUND, INTERNAL_SERVER_ERROR } = HTTP_STATUS_CODES;

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
	delete user.password;
	res.json({ data: user, success: true, message: '获取单个用户成功' });
});

// 修改用户信息
router.put(
	'/profile',
	[authenticateToken, validate(updateProfileValidation)],
	async (req, res) => {
		try {
			const userId = req.user.id;
			const { nickname, avatar } = req.body;

			// 获取用户
			const user = await User.findByPk(userId);
			if (!user) {
				return res.status(NOT_FOUND).json({
					message: '用户不存在',
					success: false,
				});
			}

			// 准备更新数据
			const updateData = {};
			if (nickname) updateData.nickname = nickname;
			if (avatar) updateData.avatar = avatar;

			// 更新用户信息
			await user.update(updateData);

			// 使旧 token 失效
			const oldToken = req.headers.authorization?.split(' ')[1];
			if (oldToken) {
				const decoded = jwt.decode(oldToken);
				const exp = decoded?.exp;
				if (exp) {
					const ttl = exp - Math.floor(Date.now() / 1000);
					if (ttl > 0) {
						await redis.setex(
							`blacklist:${oldToken}`,
							ttl,
							'profile_updated',
						);
					}
				}
			}

			// 生成新的 JWT token
			const newToken = jwt.sign(
				{
					id: user.id,
					nickname: user.nickname,
					role: user.role,
					email: user.email,
				},
				process.env.JWT_SECRET,
				{ expiresIn: '7d' },
			);

			// 删除密码字段
			const userWithoutPassword = user.toJSON(); // 转换为普通对象
			delete userWithoutPassword.password;

			res.json({
				message: '用户信息更新成功',
				data: {
					token: newToken,
					userInfo: encryptData(userWithoutPassword), // 只加密用户信息
				},
				success: true,
			});
		} catch (err) {
			res.status(INTERNAL_SERVER_ERROR).json({
				message: '服务器错误',
				error: err.message,
				success: false,
			});
		}
	},
);

module.exports = router;
