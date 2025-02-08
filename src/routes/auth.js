const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/User');
const sendEmail = require('../config/email');
const redis = require('../config/redis');

// 校验规则
const validate = require('../middlewares/validate');
const {
	registerValidation,
	loginValidation,
} = require('../middlewares/validations/userValidation');

// 状态码
const HTTP_STATUS_CODES = require('../utils/httpStatusCodes');
const { BAD_REQUEST, INTERNAL_SERVER_ERROR, CREATED, UNAUTHORIZED } =
	HTTP_STATUS_CODES;

require('dotenv').config();

const router = express.Router();

// 生成随机验证码
const generateCode = () => crypto.randomInt(100000, 999999).toString();

// 📩 发送验证码
router.post('/send-code', async (req, res) => {
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
		return res.json({ message: '验证码已发送！请检查你的邮箱。' });
	} else {
		return res
			.status(INTERNAL_SERVER_ERROR)
			.json({ message: '发送失败，请稍后再试！', success: false });
	}
});

// 📝 注册接口
router.post('/register', validate(registerValidation), async (req, res) => {
	try {
		const { email, username, password, code } = req.body;

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

		// 检查用户是否已存在
		const existUser = await User.findOne({ where: { email } });
		if (existUser)
			return res
				.status(BAD_REQUEST)
				.json({ message: '邮箱已被注册', success: false });

		// 加密密码 & 创建用户
		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await User.create({
			username,
			email,
			password: hashedPassword,
		});

		// 删除验证码
		await redis.del(`code:${email}`);

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

		// 检查用户是否存在
		const user = await User.findOne({ where: { email } });
		if (!user)
			return res
				.status(UNAUTHORIZED)
				.json({ message: '邮箱或密码错误', success: false });

		// 验证密码
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch)
			return res
				.status(UNAUTHORIZED)
				.json({ message: '邮箱或密码错误', success: false });

		// 生成 JWT
		const token = jwt.sign(
			{ id: user.id, email: user.email },
			process.env.JWT_SECRET,
			{ expiresIn: '7d' },
		);

		res.json({ message: '登录成功', token, success: true });
	} catch (err) {
		res.status(INTERNAL_SERVER_ERROR).json({
			message: '服务器错误',
			error: err.message,
			success: false,
		});
	}
});

module.exports = router;
