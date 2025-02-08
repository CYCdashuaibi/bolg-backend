const { body } = require('express-validator');

const emailRule = body('email').isEmail().withMessage('邮箱格式不正确');
const passwordRule = body('password')
	.isLength({ min: 6 })
	.withMessage('密码长度至少 6 位');

module.exports = { emailRule, passwordRule };
