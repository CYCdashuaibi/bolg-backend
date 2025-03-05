const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ArticleLike = sequelize.define(
	'ArticleLike',
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		article_id: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
		},
		user_id: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
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
		tableName: 'article_likes',
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	},
);

// 建立关联（例如在 Article 模型中）
ArticleLike.associate = function (models) {
	ArticleLike.belongsTo(models.Article, { foreignKey: 'article_id' });
	ArticleLike.belongsTo(models.User, { foreignKey: 'user_id' });
};

module.exports = ArticleLike;
