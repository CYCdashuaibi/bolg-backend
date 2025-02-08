const sequelize = require('../config/database');
const User = require('./user');
const Category = require('./category');
const Tag = require('./tag');

// 同步数据库
const syncDB = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('✅ 数据库同步成功');
    } catch (error) {
        console.error('❌ 数据库同步失败:', error);
    }
};

module.exports = { syncDB, User, Category, Tag };
