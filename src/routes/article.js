const express = require('express');
const { Op } = require('sequelize');

const { Article, Tag, Category, User } = require('../models');
const authenticateToken = require('../middlewares/authenticate'); // 引入认证中间件

const router = express.Router();

// 状态码
const HTTP_STATUS_CODES = require('../utils/httpStatusCodes');
const { INTERNAL_SERVER_ERROR, NOT_FOUND } = HTTP_STATUS_CODES;

// 创建文章接口
router.post('/create', authenticateToken, async (req, res) => {
	try {
		const {
			category_id,
			title,
			slug,
			summary,
			content,
			cover_image,
			status,
			tags, // tags 期望为数组，如 [1,2,3]
		} = req.body;

		const user_id = req.user.id;

		// 如果没有传入状态，则默认保存为草稿
		const articleStatus = status || 'draft';

		// 创建文章
		const article = await Article.create({
			user_id,
			category_id,
			title,
			slug,
			summary,
			content,
			cover_image,
			status: articleStatus,
		});

		// 如果提供了 tags 数组，则建立文章与标签的关联关系
		if (tags && Array.isArray(tags)) {
			// 假设 tags 中存放的是标签 ID 数组
			await article.setTags(tags);
		}

		res.json({ success: true, data: article, message: '文章创建成功' });
	} catch (error) {
		console.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '创建文章失败',
		});
	}
});

// 获取文章列表接口
router.get('/list', async (req, res) => {
	try {
		const { keyword, category, tags, status, sort, page, limit } =
			req.query;
		const pageNumber = parseInt(page, 10) || 1;
		const pageSize = parseInt(limit, 10) || 10;
		const offset = (pageNumber - 1) * pageSize;

		// 构造 where 条件
		let whereClause = {};
		// 文章状态：如果传入 status 则使用，否则默认只返回 published 文章
		whereClause.status = status || 'published';

		if (keyword) {
			whereClause[Op.or] = [
				{ title: { [Op.like]: `%${keyword}%` } },
				{ summary: { [Op.like]: `%${keyword}%` } },
				{ content: { [Op.like]: `%${keyword}%` } },
			];
		}

		if (category) {
			whereClause.category_id = category;
		}

		// 构造 include 条件
		let includeClause = [];
		// 处理标签关联，如果传入 tags，则进行过滤；否则返回所有关联的标签
		if (tags && Array.isArray(tags) && tags.length) {
			const tagIds = tags.map((id) => parseInt(id, 10));
			includeClause.push({
				model: Tag,
				where: { id: { [Op.in]: tagIds } },
				through: { attributes: [] },
			});
		} else {
			includeClause.push({
				model: Tag,
				through: { attributes: [] },
			});
		}
		// 返回分类的名称
		includeClause.push({
			model: Category,
			attributes: ['name'],
		});

		// 返回文章所属用户的用户名
		includeClause.push({
			model: User,
			attributes: ['id', 'nickname'],
		});

		// 构造排序规则
		let orderClause = [];
		if (sort) {
			let sortArray;
			try {
				sortArray = JSON.parse(sort);
			} catch (e) {
				// 当作逗号分隔字符串处理，例如 "view_count:asc,like_count:desc"
				sortArray = sort.split(',');
			}
			sortArray.forEach((item) => {
				let [field, dir] = item.split(':');
				dir = dir ? dir.toUpperCase() : 'DESC';
				orderClause.push([field, dir]);
			});
		} else {
			orderClause.push(['created_at', 'DESC']);
		}

		const articles = await Article.findAndCountAll({
			where: whereClause,
			include: includeClause,
			order: orderClause,
			offset,
			limit: pageSize,
		});

		res.json({
			success: true,
			data: articles,
			message: '获取文章列表成功',
		});
	} catch (error) {
		console.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '获取文章列表失败',
		});
	}
});

// 获取单个文章详情接口
router.get('/detail/:id', async (req, res) => {
	try {
		const article = await Article.findByPk(req.params.id, {
			include: [
				{ 
					model: Tag, 
					through: { 
						attributes: []  // Exclude the through table data
					} 
				},
				{ model: Category, attributes: ['id', 'name'] },
				{ model: User, attributes: ['id', 'nickname'] },
			],
		});
		if (!article) {
			return res
				.status(NOT_FOUND)
				.json({ success: false, message: '文章不存在' });
		}

		// 文章查看数 +1
		await article.increment('view_count');

		res.json({
			success: true,
			data: { ...article.toJSON(), view_count: article.view_count + 1 },
			message: '获取文章详情成功',
		});
	} catch (error) {
		console.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '获取文章详情失败',
		});
	}
});

// 更新文章接口
router.put('/update/:id', async (req, res) => {
	try {
		const article = await Article.findByPk(req.params.id);
		if (!article) {
			return res
				.status(NOT_FOUND)
				.json({ success: false, message: '文章不存在' });
		}
		const { tags, ...updateData } = req.body;
		// 更新文章内容
		await article.update(updateData);

		// 如果提供了 tags，更新关联关系
		if (tags && Array.isArray(tags)) {
			await article.setTags(tags);
		}

		res.json({ success: true, data: article, message: '更新文章成功' });
	} catch (error) {
		console.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '更新文章失败',
		});
	}
});

// 删除文章接口（逻辑删除，将文章状态更新为 archived）
router.delete('/delete/:id', async (req, res) => {
	try {
		const article = await Article.findByPk(req.params.id);
		if (!article) {
			return res
				.status(NOT_FOUND)
				.json({ success: false, message: '文章不存在' });
		}
		await article.update({ status: 'archived' });
		res.json({ success: true, message: '文章已归档（删除）' });
	} catch (error) {
		console.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '删除文章失败',
		});
	}
});

module.exports = router;
