const { body } = require('express-validator');
const { emailRule, passwordRule } = require('./commonRules');

// 注册校验规则
const registerValidation = [
	emailRule,
	body('username').notEmpty().withMessage('用户名不能为空'),
	passwordRule,
	body('code').isNumeric().withMessage('验证码必须是数字'),
];

// 登录校验规则
const loginValidation = [emailRule, passwordRule];

module.exports = { registerValidation, loginValidation };
