const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const routes = require('./routes');
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

// CORS配置
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 压缩响应
app.use(compression());

// 日志中间件
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
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

// API路由
app.use('/api', routes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '用户管理系统API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth'
    }
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    msg: '接口不存在',
    path: req.path
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  logger.error('全局错误:', err);
  
  // 处理不同类型的错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      msg: '数据验证失败',
      errors: err.errors
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      code: 401,
      msg: '未授权访问'
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      code: 400,
      msg: '数据已存在'
    });
  }
  
  // 默认错误响应
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
    
    // 测试数据库连接
    await testConnection();
    logger.info('✅ 数据库连接成功');
    
    // 同步数据库表
    await syncDatabase();
    logger.info('✅ 数据库表同步成功');
    
    // 测试Redis连接
    await redis.ping();
    logger.info('✅ Redis连接成功');
    
    logger.info('✅ 所有服务初始化完成');
  } catch (error) {
    logger.error('❌ 服务初始化失败:', error);
    throw error;
  }
};

module.exports = { app, initialize };