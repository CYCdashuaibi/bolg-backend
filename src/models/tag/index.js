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
		},
	},
	{
		timestamps: true,
		tableName: 'tags',
	},
);

module.exports = Tag;
