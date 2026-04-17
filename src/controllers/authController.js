const { User } = require('../models');
const redis = require('../config/redis');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const {
  validatePasswordStrength,
  validateEmail,
  validateUsername,
  isEmailLogin,
  weakPasswords
} = require('../utils/validators');
const { LOGIN_FAIL_LIMIT, LOGIN_LOCK_TIME } = require('../utils/constants');

// 生成JWT Token
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    status: user.status
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// 生成刷新Token
const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });
};

// 用户注册
const register = async (req, res, next) => {
  try {
    const { username, email, password, captcha, captchaKey } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    
    logger.info(`注册请求 - IP: ${clientIp}, 用户名: ${username}`);
    
    // 1. 验证验证码
    if (!captchaKey || !captcha) {
      return res.status(400).json({
        code: 400,
        msg: '注册失败，请检查输入信息'
      });
    }
    
    const storedCaptcha = await redis.get(`captcha:${captchaKey}`);
    if (!storedCaptcha || storedCaptcha.toLowerCase() !== captcha.toLowerCase()) {
      logger.warn(`验证码错误 - IP: ${clientIp}`);
      return res.status(400).json({
        code: 400,
        msg: '注册失败，请检查输入信息'
      });
    }
    
    // 2. 验证用户名格式
    const trimmedUsername = username.trim();
    if (!validateUsername(trimmedUsername)) {
      return res.status(400).json({
        code: 400,
        msg: '注册失败，请检查输入信息'
      });
    }
    
    // 3. 验证邮箱格式
    if (!validateEmail(email)) {
      return res.status(400).json({
        code: 400,
        msg: '注册失败，请检查输入信息'
      });
    }
    
    // 4. 验证密码强度
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        code: 400,
        msg: '注册失败，请检查输入信息'
      });
    }
    
    // 5. 检查弱密码黑名单
    if (weakPasswords.has(password.toLowerCase())) {
      logger.warn(`弱密码尝试 - IP: ${clientIp}`);
      return res.status(400).json({
        code: 400,
        msg: '注册失败，请检查输入信息'
      });
    }
    
    // 6. 检查用户名和邮箱是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: trimmedUsername },
          { email: email }
        ]
      }
    });
    
    if (existingUser) {
      logger.warn(`用户名或邮箱已存在 - IP: ${clientIp}`);
      return res.status(400).json({
        code: 400,
        msg: '注册失败，请检查输入信息'
      });
    }
    
    // 7. 创建用户
    const user = await User.create({
      username: trimmedUsername,
      email: email,
      password: password,
      status: 'active'
    });
    
    // 8. 删除验证码
    await redis.del(`captcha:${captchaKey}`);
    
    // 9. 记录注册日志
    logger.info(`用户注册成功 - 用户名: ${trimmedUsername}, 邮箱: ${email}, IP: ${clientIp}`);
    
    // 10. 返回成功响应
    res.json({
      code: 200,
      msg: '操作成功，若邮箱有效',
      data: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    logger.error('注册错误:', error);
    next(error);
  }
};

// 用户登录
const login = async (req, res, next) => {
  try {
    const { account, password, captcha, captchaKey } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    
    logger.info(`登录请求 - IP: ${clientIp}, 账号: ${account}`);
    
    // 1. 检查账号是否被锁定
    const lockKey = `login_lock:${account}`;
    const isLocked = await redis.get(lockKey);
    
    if (isLocked) {
      const ttl = await redis.ttl(lockKey);
      logger.warn(`账号已锁定 - 账号: ${account}, 剩余时间: ${ttl}秒`);
      return res.status(403).json({
        code: 403,
        msg: '账号已被临时锁定，请稍后再试',
        lockRemaining: ttl
      });
    }
    
    // 2. 获取失败次数
    const failKey = `login_fail:${account}`;
    let failCount = parseInt(await redis.get(failKey)) || 0;
    
    // 3. 失败超过3次需要验证码
    if (failCount >= LOGIN_FAIL_LIMIT.CAPTCHA_REQUIRED) {
      if (!captchaKey || !captcha) {
        return res.json({
          code: 400,
          msg: '请输入验证码',
          requireCaptcha: true,
          remainAttempts: LOGIN_FAIL_LIMIT.MAX_ATTEMPTS - failCount
        });
      }
      
      const storedCaptcha = await redis.get(`captcha:${captchaKey}`);
      if (!storedCaptcha || storedCaptcha.toLowerCase() !== captcha.toLowerCase()) {
        logger.warn(`验证码错误 - 账号: ${account}`);
        return res.json({
          code: 400,
          msg: '验证码错误',
          requireCaptcha: true,
          remainAttempts: LOGIN_FAIL_LIMIT.MAX_ATTEMPTS - failCount
        });
      }
    }
    
    // 4. 查找用户
    const user = await User.findByAccount(account.trim());
    
    // 5. 验证用户和密码
    if (!user || !(await user.validatePassword(password))) {
      // 增加失败次数
      await redis.incr(failKey);
      await redis.expire(failKey, LOGIN_LOCK_TIME.FAIL_RECORD);
      
      failCount++;
      
      logger.warn(`登录失败 - 账号: ${account}, 失败次数: ${failCount}, IP: ${clientIp}`);
      
      // 失败5次锁定账号
      if (failCount >= LOGIN_FAIL_LIMIT.MAX_ATTEMPTS) {
        await redis.setex(lockKey, LOGIN_LOCK_TIME.ACCOUNT_LOCK, '1');
        logger.warn(`账号已锁定 - 账号: ${account}`);
        return res.status(403).json({
          code: 403,
          msg: '账号已被临时锁定，请稍后再试',
          lockDuration: LOGIN_LOCK_TIME.ACCOUNT_LOCK
        });
      }
      
      // 判断是否需要验证码
      const requireCaptcha = failCount >= LOGIN_FAIL_LIMIT.CAPTCHA_REQUIRED;
      
      return res.json({
        code: 401,
        msg: `账号或密码错误，你还有 ${LOGIN_FAIL_LIMIT.MAX_ATTEMPTS - failCount} 次尝试机会`,
        remainAttempts: LOGIN_FAIL_LIMIT.MAX_ATTEMPTS - failCount,
        requireCaptcha
      });
    }
    
    // 6. 检查账号状态
    if (user.status !== 'active') {
      logger.warn(`账号非活跃状态 - 账号: ${account}, 状态: ${user.status}`);
      return res.status(403).json({
        code: 403,
        msg: '账号已被禁用，请联系管理员'
      });
    }
    
    // 7. 登录成功，清除失败记录
    await redis.del(failKey);
    if (captchaKey) {
      await redis.del(`captcha:${captchaKey}`);
    }
    
    // 8. 更新最后登录信息
    user.lastLoginAt = new Date();
    user.lastLoginIp = clientIp;
    user.loginAttempts = 0;
    await user.save();
    
    // 9. 生成Token
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // 10. 存储Token到Redis（用于Token管理）
    await redis.setex(`token:${user.id}`, 7 * 24 * 3600, token);
    
    logger.info(`登录成功 - 用户: ${user.username}, IP: ${clientIp}`);
    
    // 11. 返回成功响应
    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          status: user.status,
          lastLoginAt: user.lastLoginAt
        }
      }
    });
    
  } catch (error) {
    logger.error('登录错误:', error);
    next(error);
  }
};

// 获取用户信息
const getUserInfo = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'username', 'email', 'status', 'lastLoginAt', 'lastLoginIp', 'createdAt']
    });
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在'
      });
    }
    
    res.json({
      code: 200,
      data: user
    });
  } catch (error) {
    logger.error('获取用户信息错误:', error);
    next(error);
  }
};

// 刷新Token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        code: 400,
        msg: '请提供刷新令牌'
      });
    }
    
    // 验证刷新令牌
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        code: 401,
        msg: '无效的刷新令牌'
      });
    }
    
    // 查找用户
    const user = await User.findByPk(decoded.id);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        code: 401,
        msg: '用户不存在或已被禁用'
      });
    }
    
    // 生成新的Token
    const newToken = generateToken(user);
    
    // 更新Redis中的Token
    await redis.setex(`token:${user.id}`, 7 * 24 * 3600, newToken);
    
    res.json({
      code: 200,
      msg: '刷新成功',
      data: {
        token: newToken
      }
    });
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        msg: '刷新令牌无效或已过期，请重新登录'
      });
    }
    logger.error('刷新Token错误:', error);
    next(error);
  }
};

// 退出登录
const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // 将Token加入黑名单
      const decoded = jwt.decode(token);
      if (decoded) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await redis.setex(`blacklist:${token}`, expiresIn, '1');
        }
      }
      
      // 删除用户Token记录
      await redis.del(`token:${req.userId}`);
    }
    
    logger.info(`用户退出登录 - userId: ${req.userId}`);
    
    res.json({
      code: 200,
      msg: '退出成功'
    });
    
  } catch (error) {
    logger.error('退出登录错误:', error);
    next(error);
  }
};

// 修改密码
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;
    
    // 查找用户
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在'
      });
    }
    
    // 验证旧密码
    if (!(await user.validatePassword(oldPassword))) {
      return res.status(400).json({
        code: 400,
        msg: '原密码错误'
      });
    }
    
    // 验证新密码强度
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        code: 400,
        msg: passwordValidation.errors.join('；')
      });
    }
    
    // 检查弱密码黑名单
    if (weakPasswords.has(newPassword.toLowerCase())) {
      return res.status(400).json({
        code: 400,
        msg: '密码过于简单，请使用更复杂的密码'
      });
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    // 清除所有Token，强制重新登录
    await redis.del(`token:${userId}`);
    
    logger.info(`用户修改密码 - userId: ${userId}`);
    
    res.json({
      code: 200,
      msg: '密码修改成功，请重新登录'
    });
    
  } catch (error) {
    logger.error('修改密码错误:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  getUserInfo,
  refreshToken,
  logout,
  changePassword
};