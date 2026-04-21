const jwt = require('jsonwebtoken');
const redis = require('../config/redis');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ code: 401, msg: '未提供认证令牌' });
    }
    
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ code: 401, msg: '令牌已失效' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.userId = decoded.id;
    req.username = decoded.username;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, msg: '令牌已过期' });
    }
    return res.status(401).json({ code: 401, msg: '无效的认证令牌' });
  }
};

module.exports = { authMiddleware };