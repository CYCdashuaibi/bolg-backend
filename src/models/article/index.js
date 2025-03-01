const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Article = sequelize.define(
	'Article',
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true,
		},
		user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
		category_id: { type: DataTypes.BIGINT.UNSIGNED },
		title: { type: DataTypes.STRING(200) },
		slug: { type: DataTypes.STRING(200) },
		summary: { type: DataTypes.STRING(500) },
		content: { type: DataTypes.TEXT },
		cover_image: { type: DataTypes.STRING(255) },
		view_count: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
		like_count: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
		status: {
			type: DataTypes.ENUM('draft', 'published', 'archived'),
			defaultValue: 'draft',
		},
		created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
		updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
	},
	{
		tableName: 'articles',
		timestamps: false,
	},
);

// 建立模型关联
Article.associate = function (models) {
	Article.belongsToMany(models.Tag, {
		through: 'article_tags',
		foreignKey: 'article_id',
		otherKey: 'tag_id',
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	});
	Article.belongsTo(models.Category, { foreignKey: 'category_id' });
};

Article.associate = function (models) {
	// 文章所属用户
	Article.belongsTo(models.User, { foreignKey: 'user_id' });

	// 其他关联，如分类、标签等
	Article.belongsTo(models.Category, { foreignKey: 'category_id' });
	Article.belongsToMany(models.Tag, {
		through: 'article_tags',
		foreignKey: 'article_id',
		otherKey: 'tag_id',
	});
};

module.exports = Article;
