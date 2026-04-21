const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { syncDatabase } = require('./models');
const redis = require('./config/redis');
const logger = require('./utils/logger');

// 创建Express应用
const app = express();

// 创建日志目录
const logDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS配置 - 支持局域网访问
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      /^http:\/\/192\.168\.\d+\.\d+:8080$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:8080$/,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:8080$/
    ];
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(pattern => {
      if (typeof pattern === 'string') return pattern === origin;
      return pattern.test(origin);
    });
    if (isAllowed) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 请求日志中间件
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.debug(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// ========== 导入路由 ==========
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/order');
const newsRoutes = require('./routes/news');
const libraryRoutes = require('./routes/library');

// 尝试导入可能不存在的路由
let goodsRoutes, walletRoutes;
try { goodsRoutes = require('./routes/goods'); } catch (e) { goodsRoutes = express.Router(); }
try { walletRoutes = require('./routes/wallet'); } catch (e) { walletRoutes = express.Router(); }

// 论坛路由
const postRoutes = require('./routes/post');
const commentRoutes = require('./routes/comment');

// ========== 挂载路由 ==========
app.use('/api', authRoutes);                      // 认证相关
app.use('/api/order', orderRoutes);               // 订单相关
app.use('/api/goods', goodsRoutes);               // 商品相关
app.use('/api/library', libraryRoutes);           // 图书馆相关
app.use('/api/wallet', walletRoutes);             // 钱包相关
app.use('/api/news', newsRoutes);                 // 新闻相关

// 论坛模块路由
app.use('/api/post', postRoutes);                 // 帖子相关
app.use('/api/post/:postId/comment', commentRoutes); // 评论相关（嵌套路由）

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '用户管理系统API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ code: 404, msg: '接口不存在', path: req.path });
});

// 全局错误处理
app.use((err, req, res, next) => {
  logger.error('全局错误:', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    code: statusCode,
    msg: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 初始化函数
const initialize = async () => {
  try {
    logger.info('开始初始化服务...');
    await testConnection();
    logger.info('✅ 数据库连接成功');
    await syncDatabase();
    logger.info('✅ 数据库表同步成功');
    await redis.ping();
    logger.info('✅ Redis连接成功');
    logger.info('✅ 所有服务初始化完成');
  } catch (error) {
    logger.error('❌ 服务初始化失败:', error);
    throw error;
  }
};

module.exports = { app, initialize };