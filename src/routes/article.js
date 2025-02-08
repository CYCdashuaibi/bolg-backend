const express = require('express');
const { Article } = require('../models');
const validate = require('../middleware/validate');
const {
	articleValidation,
} = require('../middleware/validations/articleValidation');

const router = express.Router();

// 📝 发布文章
router.post('/create', validate(articleValidation), async (req, res) => {
	const { title, content, category_id } = req.body;

	const article = await Article.create({ title, content, category_id });
	return res.json({ message: '文章发布成功！', article, success: true });
});

module.exports = router;
