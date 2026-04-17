// 弱密码黑名单
const weakPasswords = new Set([
  '12345678', 'password123', 'qwertyui', '123456789',
  '11111111', '123123123', 'password', '123456',
  '1234567', '1234567890', 'qwerty123', 'abc123456',
  'password1', 'admin123', 'letmein', 'welcome1',
  'monkey123', 'dragon123', 'master123', 'hello123',
  'freedom1', 'whatever', 'qazwsxedc', 'trustno1'
]);

// 验证密码强度
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('密码长度至少为8位');
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('密码必须包含字母');
  }
  
  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字');
  }
  
  if (password && password.length > 32) {
    errors.push('密码长度不能超过32位');
  }
  
  // 检查是否包含空格
  if (password && /\s/.test(password)) {
    errors.push('密码不能包含空格');
  }
  
  if (weakPasswords.has(password?.toLowerCase())) {
    errors.push('密码过于简单，请使用更复杂的密码');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// 验证邮箱格式（仅支持.edu.cn）
const validateEmail = (email) => {
  if (!email) return false;
  
  // 基本邮箱格式验证
  const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.edu\.cn$/;
  return emailRegex.test(email);
};

// 验证用户名格式
const validateUsername = (username) => {
  if (!username) return false;
  
  // 长度3-20，只能包含字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// 判断是否为邮箱登录
const isEmailLogin = (account) => {
  return account && account.includes('@');
};

// 验证手机号格式
const validatePhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// 验证IP地址格式
const validateIP = (ip) => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

// 密码强度评分（0-4）
const getPasswordStrengthScore = (password) => {
  if (!password) return 0;
  
  let score = 0;
  
  // 长度评分
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // 复杂度评分
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  return Math.min(4, Math.floor(score / 1.5));
};

module.exports = {
  weakPasswords,
  validatePasswordStrength,
  validateEmail,
  validateUsername,
  isEmailLogin,
  validatePhone,
  validateIP,
  getPasswordStrengthScore
};