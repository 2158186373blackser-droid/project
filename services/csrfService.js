const crypto = require('crypto');
const redis = require('../config/redis');

const TOKEN_EXPIRE = 3600; // 1小时

const generateToken = async (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const key = `csrf:${userId}:${token}`;
  await redis.setex(key, TOKEN_EXPIRE, '1');
  return token;
};

const verifyToken = async (userId, token) => {
  if (!userId || !token) return false;
  const key = `csrf:${userId}:${token}`;
  const exists = await redis.exists(key);
  if (exists) await redis.del(key); // 一次性使用
  return !!exists;
};

module.exports = { generateToken, verifyToken };