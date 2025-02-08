const { body } = require('express-validator');

const articleValidation = [
	body('title').notEmpty().withMessage('文章标题不能为空'),
	body('content').notEmpty().withMessage('文章内容不能为空'),
	body('category_id').isNumeric().withMessage('分类 ID 必须是数字'),
];

module.exports = { articleValidation };
