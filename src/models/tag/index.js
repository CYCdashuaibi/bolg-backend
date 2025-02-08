const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Category = require('../category');

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
		},
		category_id: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: true,
			references: {
				model: Category,
				key: 'id',
			},
		},
	},
	{
		timestamps: true,
		tableName: 'tags',
	},
);

Tag.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

module.exports = Tag;
