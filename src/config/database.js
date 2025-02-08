require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        logging: false, // 关闭日志输出
    }
);

// 测试数据库连接
sequelize.authenticate()
    .then(() => console.log('✅ 数据库连接成功'))
    .catch(err => console.error('❌ 数据库连接失败:', err));

module.exports = sequelize;
