const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define(
	'User',
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		nickname: {
			type: DataTypes.STRING(50),
			allowNull: false,
			unique: true,
		},
		avatar: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		email: {
			type: DataTypes.STRING(100),
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true,
			},
		},
		password: {
			type: DataTypes.STRING(100),
			allowNull: false,
		}, 
		role: {
			type: DataTypes.ENUM('admin', 'user'),
			defaultValue: 'user',
		},
	},
	{
		tableName: 'users',
		timestamps: true,
		hooks: {
			beforeCreate: async (user) => {
				const salt = await bcrypt.genSalt(10);
				user.password = await bcrypt.hash(user.password, salt);
			},
		},
	},
);

module.exports = User;
