const { body } = require('express-validator');
const { emailRule, passwordRule } = require('./commonRules');

// 获取验证码校验规则
const getCodeValidation = [emailRule];

// 验证码校验规则
const codeValidation = [
	emailRule,
	body('code').isNumeric().withMessage('验证码必须是数字'),
];

// 注册校验规则
const registerValidation = [
	emailRule,
	passwordRule,
];

// 登录校验规则
const loginValidation = [emailRule, passwordRule];

module.exports = {
	registerValidation,
	loginValidation,
	codeValidation,
	getCodeValidation,
};
