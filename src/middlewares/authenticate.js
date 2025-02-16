const jwt = require('jsonwebtoken');
const redis = require('../config/redis');
const { UNAUTHORIZED } = require('../utils/httpStatusCodes');

const authenticateToken = async (req, res, next) => {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) {
		return res
			.status(UNAUTHORIZED)
			.json({ message: '未授权', success: false });
	}

	try {
		// 检查 Token 是否在黑名单
		const isBlacklisted = await redis.get(`blacklist:${token}`);
		if (isBlacklisted) {
			return res
				.status(UNAUTHORIZED)
				.json({ message: 'Token 已失效，请重新登录', success: false });
		}

		// 验证 Token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded; // 将解析后的用户信息附加到请求对象
		next();
	} catch (err) {
		return res
			.status(UNAUTHORIZED)
			.json({ message: '无效 Token', success: false });
	}
};

module.exports = authenticateToken;
