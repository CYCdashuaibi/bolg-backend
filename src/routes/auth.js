const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { decryptData, encryptData } = require('../utils/encrypt');

const User = require('../models/User');
const sendEmail = require('../config/email');
const redis = require('../config/redis');

// 校验规则
const validate = require('../middlewares/validate');
const {
	getCodeValidation,
	codeValidation,
	registerValidation,
	loginValidation,
	updatePasswordValidation,
} = require('../middlewares/validations/userValidation');

const authenticateToken = require('../middlewares/authenticate'); // 引入认证中间件

// 状态码
const HTTP_STATUS_CODES = require('../utils/httpStatusCodes');
const { BAD_REQUEST, INTERNAL_SERVER_ERROR, CREATED, UNAUTHORIZED } =
	HTTP_STATUS_CODES;

require('dotenv').config();

const router = express.Router();

// 生成随机验证码
const generateCode = () => crypto.randomInt(100000, 999999).toString();

// 📩 发送验证码
router.post('/send-code', validate(getCodeValidation), async (req, res) => {
	const { email } = req.body;

	if (!email)
		return res
			.status(BAD_REQUEST)
			.json({ message: '邮箱不能为空！', success: false });

	const code = generateCode();
	const success = await sendEmail(
		email,
		'【cyc】验证码通知',
		`安全验证码${code}，打死不要告诉别人哦！`,
	);

	if (success) {
		await redis.setex(`code:${email}`, 300, code); // 设置验证码 5 分钟有效
		return res.json({
			message: '验证码已发送！请检查你的邮箱。',
			success: true,
		});
	} else {
		return res
			.status(INTERNAL_SERVER_ERROR)
			.json({ message: '发送失败，请稍后再试！', success: false });
	}
});

// 📝 校验验证码接口
router.post('/verify-code', validate(codeValidation), async (req, res) => {
	const { email, code } = req.body;

	// 校验验证码
	const storedCode = await redis.get(`code:${email}`);
	if (!storedCode) {
		return res
			.status(BAD_REQUEST)
			.json({ message: '验证码已过期', success: false });
	}
	if (code !== storedCode) {
		return res
			.status(BAD_REQUEST)
			.json({ message: '验证码错误', success: false });
	}

	// 删除验证码
	await redis.del(`code:${email}`);

	// 验证成功，返回成功状态
	res.json({ message: '验证码正确', success: true });
});

// 📝 注册接口
router.post('/register', validate(registerValidation), async (req, res) => {
	try {
		const { email, password } = req.body;
		const decryptPassword = String(decryptData(password));

		if (decryptPassword.length < 6)
			return res
				.status(BAD_REQUEST)
				.json({ message: '密码长度至少 6 位', success: false });

		// 检查用户是否已存在
		const existUser = await User.findOne({ where: { email } });
		if (existUser)
			return res
				.status(BAD_REQUEST)
				.json({ message: '邮箱已被注册', success: false });

		// 创建用户
		const user = await User.create({
			email,
			nickname: email,
			password: decryptPassword,
		});

		res.status(CREATED).json({
			message: '注册成功',
			userId: user.id,
			success: true,
		});
	} catch (err) {
		res.status(INTERNAL_SERVER_ERROR).json({
			message: '服务器错误',
			error: err.message,
			success: false,
		});
	}
});

// 🔑 登录接口
router.post('/login', validate(loginValidation), async (req, res) => {
	try {
		const { email, password } = req.body;

		const decryptPassword = String(decryptData(password));

		// 检查用户是否存在
		const user = await User.findOne({ where: { email } });
		if (!user)
			return res
				.status(UNAUTHORIZED)
				.json({ message: '用户不存在', success: false });

		// 验证密码
		const isMatch = await bcrypt.compare(decryptPassword, user.password);
		if (!isMatch)
			return res
				.status(UNAUTHORIZED)
				.json({ message: '密码错误', success: false });

		// 生成 JWT
		const token = jwt.sign(
			{
				id: user.id,
				nickname: user.nickname,
				role: user.role,
				email: user.email,
			},
			process.env.JWT_SECRET,
			{ expiresIn: '7d' },
		);

		// 删除用户密码
		delete user.password;

		res.json({
			message: '登录成功',
			data: { token, userInfo: encryptData(user) },
			success: true,
		});
	} catch (err) {
		res.status(INTERNAL_SERVER_ERROR).json({
			message: '服务器错误',
			error: err.message,
			success: false,
		});
	}
});

// 🔑 退出登录
router.post('/logout', authenticateToken, async (req, res) => {
	try {
		const token = req.headers.authorization?.split(' ')[1];
		if (!token) {
			return res
				.status(UNAUTHORIZED)
				.json({ message: '未提供 Token', success: false });
		}

		// 获取 Token 过期时间
		const decoded = jwt.decode(token);
		const exp = decoded?.exp;
		if (!exp) {
			return res
				.status(BAD_REQUEST)
				.json({ message: '无效 Token', success: false });
		}

		// 计算剩余时间（秒）
		const ttl = exp - Math.floor(Date.now() / 1000);
		if (ttl > 0) {
			// 将 Token 存入 Redis，使其失效
			await redis.setex(`blacklist:${token}`, ttl, 'logout');
		}

		res.json({ message: '退出成功', success: true });
	} catch (err) {
		res.status(INTERNAL_SERVER_ERROR).json({
			message: '服务器错误',
			error: err.message,
			success: false,
		});
	}
});

// 🔑 修改密码接口
router.post(
	'/update-password',
	[authenticateToken, validate(updatePasswordValidation)],
	async (req, res) => {
		try {
			const { oldPassword, newPassword } = req.body;
			const userId = req.user.id;

			// 解密密码
			const decryptedOldPassword = String(decryptData(oldPassword));
			const decryptedNewPassword = String(decryptData(newPassword));

			// 获取用户
			const user = await User.findByPk(userId);
			if (!user) {
				return res.status(NOT_FOUND).json({
					message: '用户不存在',
					success: false,
				});
			}

			// 验证旧密码
			const isMatch = await bcrypt.compare(
				decryptedOldPassword,
				user.password,
			);
			if (!isMatch) {
				return res.status(BAD_REQUEST).json({
					message: '旧密码错误',
					success: false,
				});
			}

			// 检查新密码长度
			if (decryptedNewPassword.length < 6) {
				return res.status(BAD_REQUEST).json({
					message: '新密码长度至少6位',
					success: false,
				});
			}

			// 生成新密码的哈希值
			const salt = await bcrypt.genSalt(10);
			const hashedNewPassword = await bcrypt.hash(
				decryptedNewPassword,
				salt,
			);

			// 更新密码
			await user.update({ password: hashedNewPassword });

			// 使当前token失效
			const token = req.headers.authorization?.split(' ')[1];
			if (token) {
				const decoded = jwt.decode(token);
				const exp = decoded?.exp;
				if (exp) {
					const ttl = exp - Math.floor(Date.now() / 1000);
					if (ttl > 0) {
						await redis.setex(
							`blacklist:${token}`,
							ttl,
							'password_changed',
						);
					}
				}
			}

			res.json({
				message: '密码修改成功，请重新登录',
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
