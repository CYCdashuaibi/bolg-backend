const sequelize = require('../config/database');

// 导入模型
const User = require('./user');
const Category = require('./category');
const Tag = require('./tag');
const Article = require('./article');
const Comment = require('./comment');
const ArticleLike = require('./articleLike');
const CommentLike = require('./commentLike');

// 这里确保 models 被正确关联
const models = { User, Category, Tag, Article, Comment, ArticleLike, CommentLike };

Object.values(models).forEach((model) => {
	if (model.associate) {
		model.associate(models);
	}
});

// 同步数据库
const syncDB = async () => {
	try {
		await sequelize.sync({ alter: false, force: false });
		console.log('✅ 数据库同步成功');
	} catch (error) {
		console.error('❌ 数据库同步失败:', error);
	}
};

module.exports = { syncDB, User, Category, Tag, Article, Comment, ArticleLike, CommentLike };
