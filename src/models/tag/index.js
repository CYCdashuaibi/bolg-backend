const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Tag = sequelize.define(
	'Tag',
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING(50),
			allowNull: false,
			unique: true,
		},
		created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
		updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
	},
	{
		timestamps: true,
		createdAt: 'created_at', // 指定 Sequelize 应该使用 `created_at`
		updatedAt: 'updated_at', // 指定 Sequelize 应该使用 `updated_at`
		tableName: 'tags',
	},
);

// 建立模型关联
Tag.associate = function (models) {
	Tag.belongsToMany(models.Article, {
		through: 'article_tags',
		foreignKey: 'tag_id',
		otherKey: 'article_id',
		timestamps: true, // 保持时间戳
		createdAt: 'created_at', // 告诉 Sequelize 使用 `created_at` 而不是 `createdAt`
		updatedAt: 'updated_at', // 告诉 Sequelize 使用 `updated_at` 而不是 `updatedAt`
	});
};

module.exports = Tag;
