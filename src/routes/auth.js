const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getUserInfo,
  refreshToken,
  logout,
  changePassword
} = require('../controllers/authController');
const {
  generateCaptcha,
  verifyCaptcha
} = require('../controllers/captchaController');
const {
  registerLimiter,
  loginLimiter,
  dailyRegisterLimiter
} = require('../middleware/rateLimiter');
const { authMiddleware } = require('../middleware/auth');

// 验证码路由
router.get('/captcha', generateCaptcha);
router.post('/captcha/verify', verifyCaptcha);

// 认证路由
router.post('/register', registerLimiter, dailyRegisterLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/refresh-token', refreshToken);

// 需要认证的路由
router.get('/user/info', authMiddleware, getUserInfo);
router.post('/logout', authMiddleware, logout);
router.post('/change-password', authMiddleware, changePassword);

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;