const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { syncDB } = require('./models');

const app = express();
app.use(cors());
app.use(bodyParser.json());
// 配置解析表单数据的中间件
// 解析 application / x-www-form-urlencoded 格式的表单数据的中间件
app.use(express.urlencoded({ extended: false }));

// 设置静态文件目录
app.use('/uploads', express.static('uploads'));


/* ================= 路由相关 start =============== */
app.use('/api/upload', require('./routes/upload'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/tag', require('./routes/tags'));
app.use('/api/category', require('./routes/category'));
app.use('/api/article', require('./routes/article'));
app.use('/api/article/comment', require('./routes/comment'));
/* ================= 路由相关 end =============== */

// 服务器启动时同步数据库
syncDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
