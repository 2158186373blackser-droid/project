// 登录失败限制
const LOGIN_FAIL_LIMIT = {
  MAX_ATTEMPTS: 5,
  CAPTCHA_REQUIRED: 3
};

// 锁定时间（秒）
const LOGIN_LOCK_TIME = {
  ACCOUNT_LOCK: 1800,
  FAIL_RECORD: 1800
};

module.exports = {
  LOGIN_FAIL_LIMIT,
  LOGIN_LOCK_TIME
};