const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const CommentLike = sequelize.define(
	'CommentLike',
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		comment_id: {
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
	},
	{
		tableName: 'comment_likes',
		timestamps: false,
	},
);

CommentLike.associate = function (models) {
	CommentLike.belongsTo(models.Comment, { foreignKey: 'comment_id' });
	CommentLike.belongsTo(models.User, { foreignKey: 'user_id' });
};

module.exports = CommentLike;
