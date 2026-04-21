const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');

// 挂载认证路由
router.use('/auth', authRoutes);
router.use('/', authRoutes); // 兼容直接访问

// API文档路由
router.get('/docs', (req, res) => {
  res.json({
    name: '用户管理系统API',
    version: '1.0.0',
    endpoints: {
      captcha: {
        'GET /captcha': '获取图形验证码',
        'POST /captcha/verify': '验证验证码'
      },
      auth: {
        'POST /register': '用户注册',
        'POST /login': '用户登录',
        'POST /refresh-token': '刷新Token',
        'POST /logout': '退出登录',
        'GET /user/info': '获取用户信息',
        'POST /change-password': '修改密码'
      }
    }
  });
});

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;