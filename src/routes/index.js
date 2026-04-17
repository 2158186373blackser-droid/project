const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');

// API版本
const API_VERSION = 'v1';

// 挂载路由
router.use(`/${API_VERSION}/auth`, authRoutes);

// 也可以直接挂载（兼容旧版本）
router.use('/', authRoutes);

// API文档路由（可选）
router.get('/docs', (req, res) => {
  res.json({
    name: '用户管理系统API',
    version: '1.0.0',
    endpoints: {
      captcha: {
        'GET /captcha': '获取图形验证码',
        'POST /captcha/verify': '验证验证码',
        'POST /captcha/refresh': '刷新验证码'
      },
      auth: {
        'POST /register': '用户注册',
        'POST /login': '用户登录',
        'POST /refresh-token': '刷新Token',
        'POST /logout': '退出登录',
        'GET /user/info': '获取用户信息',
        'POST /change-password': '修改密码'
      },
      system: {
        'GET /health': '健康检查',
        'GET /docs': 'API文档'
      }
    }
  });
});

module.exports = router;