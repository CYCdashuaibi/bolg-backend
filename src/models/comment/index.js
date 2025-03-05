const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Comment = sequelize.define(
	'Comment',
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true,
		},
		article_id: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
		},
		user_id: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		// 如果需要支持回复某条评论，可设置 parent_id
		parent_id: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: true,
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		updated_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: 'comments',
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	},
);

// 建立关联（确保在 models/index.js 中调用所有模型的 associate 方法）
Comment.associate = function (models) {
	// 一条评论属于某篇文章
	Comment.belongsTo(models.Article, { foreignKey: 'article_id' });
	// 一条评论属于某个用户
	Comment.belongsTo(models.User, { foreignKey: 'user_id' });
	Comment.hasMany(models.CommentLike, {
		foreignKey: 'comment_id',
		as: 'likes',
	});
	// 如果支持嵌套评论，则：
	Comment.hasMany(models.Comment, { as: 'replies', foreignKey: 'parent_id' });
	Comment.belongsTo(models.Comment, {
		as: 'parent',
		foreignKey: 'parent_id',
	});
};

module.exports = Comment;
