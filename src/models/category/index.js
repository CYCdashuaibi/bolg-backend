const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Category = sequelize.define(
	'Category',
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		alias: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		description: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		parent_id: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: true,
		},
	},
	{
		timestamps: true,
		tableName: 'categories',
	},
);

module.exports = Category;
