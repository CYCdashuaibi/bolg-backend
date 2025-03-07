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
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		hooks: {
			beforeCreate: async (user) => {
				const salt = await bcrypt.genSalt(10);
				user.password = await bcrypt.hash(user.password, salt);
			},
		},
	},
);

User.associate = function (models) {
	// 一个用户有多篇文章
	User.hasMany(models.Article, { foreignKey: 'user_id' });
};

module.exports = User;
