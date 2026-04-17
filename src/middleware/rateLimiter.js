// 简单的内存限流器（不需要 Redis）
const logger = require('../utils/logger');

// 内存存储
const store = new Map();

// 清理过期数据
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    if (data.expireAt < now) {
      store.delete(key);
    }
  }
}, 60000);

// 创建内存限流器
const createMemoryLimiter = (options) => {
  const { windowMs, max, prefix, message } = options;
  
  return async (req, res, next) => {
    const key = `${prefix}${req.ip || req.connection.remoteAddress}`;
    
    try {
      const now = Date.now();
      let data = store.get(key);
      
      if (!data || data.expireAt < now) {
        data = { count: 0, expireAt: now + windowMs };
      }
      
      if (data.count >= max) {
        logger.warn(`限流触发 - IP: ${req.ip}, 限制: ${max}/${windowMs}ms`);
        return res.status(429).json({
          code: 429,
          msg: message || '请求过于频繁，请稍后再试'
        });
      }
      
      data.count++;
      store.set(key, data);
      
      next();
    } catch (error) {
      logger.error('限流检查失败:', error);
      next();
    }
  };
};

// 注册接口限流
const registerLimiter = createMemoryLimiter({
  windowMs: 60 * 1000,
  max: 5,
  prefix: 'rl_register:',
  message: '操作成功，若邮箱有效'
});

// 登录接口限流
const loginLimiter = createMemoryLimiter({
  windowMs: 60 * 1000,
  max: 10,
  prefix: 'rl_login:',
  message: '请求过于频繁，请稍后再试'
});

// 每日注册限制
const dailyRegisterLimiter = async (req, res, next) => {
  const key = `daily_register:${req.ip || req.connection.remoteAddress}`;
  
  try {
    const now = Date.now();
    let data = store.get(key);
    
    if (!data || data.expireAt < now) {
      data = { count: 0, expireAt: now + 24 * 60 * 60 * 1000 };
    }
    
    if (data.count >= 50) {
      logger.warn(`每日注册限流触发 - IP: ${req.ip}`);
      return res.status(429).json({
        code: 429,
        msg: '操作成功，若邮箱有效'
      });
    }
    
    data.count++;
    store.set(key, data);
    
    next();
  } catch (error) {
    logger.error('每日限流检查失败:', error);
    next();
  }
};

module.exports = {
  registerLimiter,
  loginLimiter,
  dailyRegisterLimiter
};