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
const registerValidation = [emailRule, passwordRule];

// 登录校验规则
const loginValidation = [emailRule, passwordRule];

// 修改密码校验规则
const updatePasswordValidation = [
	body('oldPassword').notEmpty().withMessage('旧密码不能为空'),
	body('newPassword').notEmpty().withMessage('新密码不能为空'),
];

// 修改用户信息校验规则
const updateProfileValidation = [
	body('nickname')
		.optional()
		.isLength({ min: 2, max: 50 })
		.withMessage('昵称长度必须在2-50个字符之间'),
];

module.exports = {
	registerValidation,
	loginValidation,
	codeValidation,
	getCodeValidation,
	updatePasswordValidation,
	updateProfileValidation,
};
