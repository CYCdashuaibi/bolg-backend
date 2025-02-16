const { body } = require('express-validator');

const emailRule = body('email').isEmail().withMessage('邮箱格式不正确');
const passwordRule = body('password').notEmpty().withMessage('密码不能为空');

module.exports = { emailRule, passwordRule };
