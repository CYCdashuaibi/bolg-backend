const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

const { Comment, User, CommentLike } = require('../models'); // 假设在 models/index.js 中已经包含 Comment, User 等模型
const {
	INTERNAL_SERVER_ERROR,
	BAD_REQUEST,
	NOT_FOUND,
} = require('../utils/httpStatusCodes');
// 假设你有一个身份验证中间件
const authenticateToken = require('../middlewares/authenticate');

// 辅助函数：在树状结构中递归查找指定 id 的评论
function findCommentInTree(tree, targetId) {
	for (const comment of tree) {
		if (comment.id === targetId) return comment;
		if (comment.children && comment.children.length > 0) {
			const found = findCommentInTree(comment.children, targetId);
			if (found) return found;
		}
	}
	return null;
}

// 辅助函数：递归平铺指定节点下的所有子节点为一个列表
function flattenChildren(node) {
	let result = [];
	if (node.children && node.children.length > 0) {
		node.children.forEach((child) => {
			result.push(child);
			result = result.concat(flattenChildren(child));
		});
	}
	return result;
}

// 1. 创建评论接口（POST /comments/create）
router.post('/create', authenticateToken, async (req, res) => {
	try {
		const { article_id, content, parent_id } = req.body;
		if (!article_id || !content) {
			return res
				.status(BAD_REQUEST)
				.json({ success: false, message: '文章ID和评论内容不能为空' });
		}
		const user_id = req.user.id; // 从 token 中获取用户ID
		const comment = await Comment.create({
			article_id,
			user_id,
			content,
			parent_id: parent_id || null,
		});
		res.json({ success: true, data: comment, message: '评论创建成功' });
	} catch (error) {
		console.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '创建评论失败',
			error: error.message,
		});
	}
});

// 2. 获取指定文章的评论列表接口（GET /comments/list?article_id=xxx&page=1&limit=10）
// 此处只返回顶级评论，如需返回嵌套回复可以在后续处理或使用 include 自关联
/**
 * 获取指定文章的评论列表接口
 * 要求：
 * 1. 返回的数据构造为：每个顶级评论（parent_id 为 null）包含一个 children 数组，
 *    数组内放置所有该顶级评论的回复（无论是直接回复还是间接回复）。
 * 2. 分页的 limit 只针对顶级评论
 */
router.get('/list', authenticateToken, async (req, res) => {
	try {
		const { article_id, page, limit } = req.query;
		const user_id = req.user.id;

		if (!article_id) {
			return res
				.status(BAD_REQUEST)
				.json({ success: false, message: '必须传入文章ID' });
		}
		// 分页参数（仅针对顶级评论）
		const pageNumber = parseInt(page, 10) || 1;
		const pageSize = parseInt(limit, 10) || 10;
		const offset = (pageNumber - 1) * pageSize;

		// 1. 查询指定文章的所有评论（包括顶级和回复）
		const allComments = await Comment.findAll({
			where: { article_id },
			include: [
				{
					model: User,
					attributes: ['id', 'nickname', 'avatar'],
				},
				{
					model: CommentLike,
					as: 'likes',
					attributes: ['user_id'],
				},
				{
					model: Comment,
					as: 'parent',
					attributes: ['id', 'content', 'created_at'],
					include: [
						{
							model: User,
							attributes: ['id', 'nickname', 'avatar'],
						},
					],
				},
			],
			order: [['created_at', 'ASC']], // 按时间升序排列，便于构建回复关系（也可以根据需求调整顺序）
		});

		// 2. 将评论转换为普通对象，并添加 children 数组（用于存放回复）
		const commentMap = {};
		allComments.forEach((comment) => {
			const obj = comment.toJSON();
			obj.children = [];
			// 点赞数：likes 数组的长度
			obj.like_count =
				obj.likes && Array.isArray(obj.likes) ? obj.likes.length : 0;
			// 当前用户是否已点赞：如果当前用户ID存在且在 likes 数组中
			obj.isLiked =
				user_id &&
				obj.likes &&
				obj.likes.some((like) => like.user_id === user_id);
			// 删除 likes 数组，避免返回多余数据（可根据需要保留）
			delete obj.likes;
			// 如果存在父评论信息，并且父评论中包含用户信息，则添加 parentUser 字段
			// if (obj.parent && obj.parent.User) {
			// 	obj.parentUser = obj.parent.User;
			// }
			commentMap[obj.id] = obj;
		});

		// 3. 构建顶级评论数组，同时把所有回复归类到其顶级评论的 children 下
		const topLevelComments = [];
		allComments.forEach((comment) => {
			const commentObj = commentMap[comment.id];
			if (!commentObj.parent_id) {
				// 顶级评论直接加入数组
				topLevelComments.push(commentObj);
			} else {
				// 非顶级评论：找到其顶级父评论（递归查找）
				let parent = commentMap[commentObj.parent_id];
				// 循环查找直到找到没有 parent_id 的顶级评论
				while (parent && parent.parent_id) {
					parent = commentMap[parent.parent_id];
				}
				if (parent) {
					parent.children.push(commentObj);
				}
			}
		});

		// 4. 对顶级评论进行排序（例如：按照创建时间倒序，最新的排在最前）
		topLevelComments.sort(
			(a, b) => new Date(b.created_at) - new Date(a.created_at),
		);

		// 5. 针对顶级评论应用分页，分页的 limit 只针对顶级评论
		const paginatedTopLevel = topLevelComments.slice(
			offset,
			offset + pageSize,
		);

		// 6. 为每个顶级评论的 children 递归添加 topId 属性
		paginatedTopLevel.forEach((topComment) => {
			const topId = topComment.id;
			// 定义一个递归函数，给每个子评论添加 topId
			function assignTopId(node) {
				node.topId = topId;
				if (node.children && node.children.length > 0) {
					node.children.forEach((child) => assignTopId(child));
				}
			}
			if (topComment.children && topComment.children.length > 0) {
				topComment.children.forEach((child) => assignTopId(child));
			}
		});

		res.json({
			success: true,
			data: {
				count: topLevelComments.length,
				rows: paginatedTopLevel,
				total: allComments.length,
			},
			message: '获取评论列表成功',
		});
	} catch (error) {
		console.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '获取评论列表失败',
			error: error.message,
		});
	}
});

/**
 * GET /related/:id?article_id=xxx
 * 根据传入的评论 id 和文章 id，返回该评论在构造出的树中 children 数组中的所有信息
 */
router.get('/related/:id', authenticateToken, async (req, res) => {
	try {
		const { id } = req.params;
		const { article_id } = req.query;
		if (!id || !article_id) {
			return res
				.status(BAD_REQUEST)
				.json({ success: false, message: '必须传入评论ID和文章ID' });
		}
		const user_id = req.user.id;

		// 1. 查询指定文章的所有评论（包括顶级和回复），包含评论者和点赞数据
		const allComments = await Comment.findAll({
			where: { article_id },
			include: [
				{
					model: User,
					attributes: ['id', 'nickname', 'avatar'],
				},
				{
					model: CommentLike,
					as: 'likes',
					attributes: ['user_id'],
				},
			],
			order: [['created_at', 'ASC']],
		});

		// 2. 将所有评论转换为普通对象，并添加 children 数组，同时计算点赞信息
		const commentMap = {};
		allComments.forEach((comment) => {
			const obj = comment.toJSON();
			obj.children = [];
			obj.like_count =
				obj.likes && Array.isArray(obj.likes) ? obj.likes.length : 0;
			obj.isLiked =
				user_id &&
				obj.likes &&
				obj.likes.some((like) => like.user_id === user_id);
			delete obj.likes;
			commentMap[obj.id] = obj;
		});

		// 3. 构建树状结构：将所有非顶级评论归入其父评论的 children 数组中
		const tree = [];
		allComments.forEach((comment) => {
			const obj = commentMap[comment.id];
			if (!obj.parent_id) {
				tree.push(obj);
			} else {
				const parent = commentMap[obj.parent_id];
				if (parent) {
					parent.children.push(obj);
				}
			}
		});

		// 4. 在树状结构中查找目标评论（即传入 id 对应的评论）
		const targetComment = findCommentInTree(tree, Number(id));
		if (!targetComment) {
			return res
				.status(NOT_FOUND)
				.json({ success: false, message: '未找到评论' });
		}

		// 5. 递归平铺目标评论下的所有子评论
		const flatChildren = flattenChildren(targetComment).sort(
			(a, b) => new Date(a.created_at) - new Date(b.created_at),
		);

		// 6. 将所有评论添加 TopId 属性
		flatChildren.forEach((child) => {
			child.topId = Number(id);
		});

		res.json({
			success: true,
			data: flatChildren,
			message: '获取子评论列表成功',
		});
	} catch (error) {
		console.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '获取子评论失败',
			error: error.message,
		});
	}
});

// 3. 获取单个评论详情接口（GET /comments/:id）
router.get('/:id', async (req, res) => {
	try {
		const comment = await Comment.findByPk(req.params.id, {
			include: [
				{
					model: User,
					attributes: ['nickname', 'avatar'],
				},
			],
		});
		if (!comment) {
			return res
				.status(NOT_FOUND)
				.json({ success: false, message: '评论不存在' });
		}
		res.json({ success: true, data: comment, message: '获取评论详情成功' });
	} catch (error) {
		console.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '获取评论详情失败',
			error: error.message,
		});
	}
});

// 4. 更新评论接口（PUT /comments/:id）
router.put('/:id', authenticateToken, async (req, res) => {
	try {
		const { content } = req.body;
		const comment = await Comment.findByPk(req.params.id);
		if (!comment) {
			return res
				.status(NOT_FOUND)
				.json({ success: false, message: '评论不存在' });
		}
		// 权限校验：只有评论的作者或管理员可以更新评论
		if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
			return res
				.status(403)
				.json({ success: false, message: '无权限更新评论' });
		}
		if (!content) {
			return res
				.status(BAD_REQUEST)
				.json({ success: false, message: '评论内容不能为空' });
		}
		comment.content = content;
		await comment.save();
		res.json({ success: true, data: comment, message: '评论更新成功' });
	} catch (error) {
		console.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '更新评论失败',
			error: error.message,
		});
	}
});

// 5. 删除评论接口（DELETE /comments/:id）
router.delete('/:id', authenticateToken, async (req, res) => {
	try {
		const comment = await Comment.findByPk(req.params.id);
		if (!comment) {
			return res
				.status(NOT_FOUND)
				.json({ success: false, message: '评论不存在' });
		}
		// 权限校验：只有评论的作者或管理员可以删除评论
		if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
			return res
				.status(403)
				.json({ success: false, message: '无权限删除评论' });
		}
		await comment.destroy();
		res.json({ success: true, message: '评论删除成功' });
	} catch (error) {
		console.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '删除评论失败',
			error: error.message,
		});
	}
});

// 6. 点赞评论接口（POST /comments/like/:id）
router.post('/like/:id', authenticateToken, async (req, res) => {
	try {
		const { id } = req.params;
		const user_id = req.user.id;
		const comment = await Comment.findByPk(id);

		if (!comment) {
			return res
				.status(NOT_FOUND)
				.json({ success: false, message: '评论不存在' });
		}

		const like = await CommentLike.findOne({
			where: { comment_id: id, user_id },
		});
		if (like) {
			return res
				.status(BAD_REQUEST)
				.json({ success: false, message: '点赞失败，请勿重复点赞' });
		}
		const newLike = await CommentLike.create({
			comment_id: id,
			user_id,
		});
		res.json({ success: true, data: newLike, message: '点赞成功' });
	} catch (error) {
		console.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '点赞失败',
			error: error.message,
		});
	}
});

// 7. 取消点赞评论接口（POST /comments/unlike/:id）
router.post('/unlike/:id', authenticateToken, async (req, res) => {
	try {
		const { id } = req.params;
		const user_id = req.user.id;
		const like = await CommentLike.findOne({
			where: { comment_id: id, user_id },
		});
		if (!like) {
			return res
				.status(NOT_FOUND)
				.json({ success: false, message: '点赞不存在' });
		}
		await like.destroy();
		res.json({ success: true, message: '取消点赞成功' });
	} catch (error) {
		console.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '取消点赞失败',
			error: error.message,
		});
	}
});

module.exports = router;
