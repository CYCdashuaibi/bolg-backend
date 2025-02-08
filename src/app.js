const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { syncDB } = require('./models');

const app = express();
app.use(cors());
app.use(bodyParser.json());
// 配置解析表单数据的中间件
// 解析 application / x-www-form-urlencoded 格式的表单数据的中间件
app.use(express.urlencoded({ extended: false }))

/* ================= 路由相关 start =============== */
// 导入路由
const authRoutes = require('./routes/auth');
const tagRoutes = require('./routes/tags');

// 使用路由
app.use('/api/auth', authRoutes);
app.use('/api/tags', tagRoutes);
/* ================= 路由相关 end =============== */

// 服务器启动时同步数据库
syncDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
