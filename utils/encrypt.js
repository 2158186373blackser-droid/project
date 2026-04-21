const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.JWT_SECRET || 'default-secret-key', 'salt', 32);
const iv = Buffer.alloc(16, 0);

const encrypt = (text) => {
  if (!text) return text;
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (encrypted) => {
  if (!encrypted) return encrypted;
  try {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return null;
  }
};

// 脱敏取件码（只显示后2位）
const maskPickupCode = (code) => {
  if (!code || code.length < 2) return '**';
  return '*'.repeat(code.length - 2) + code.slice(-2);
};

module.exports = { encrypt, decrypt, maskPickupCode };