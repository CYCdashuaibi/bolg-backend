const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis({
	host: process.env.REDIS_HOST || '127.0.0.1',
	port: process.env.REDIS_PORT || 6379,
});

redis.on('error', (err) => {
	console.error('❌ Redis 连接失败:', err);
});

redis.on('connect', () => {
	console.log('✅ Redis 连接成功');
});

module.exports = redis;
