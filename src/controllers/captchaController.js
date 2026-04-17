const svgCaptcha = require('svg-captcha');
const redis = require('../config/redis');
const crypto = require('crypto');
const logger = require('../utils/logger');

// 生成图形验证码
const generateCaptcha = async (req, res) => {
  try {
    const captchaOptions = {
      size: 4,
      ignoreChars: '0o1iIlO',
      noise: 3,
      color: true,
      background: '#f5f7fa',
      width: 150,
      height: 50,
      fontSize: 40
    };
    
    const captcha = svgCaptcha.create(captchaOptions);
    const captchaId = crypto.randomBytes(16).toString('hex');
    const captchaKey = `captcha:${captchaId}`;
    
    await redis.setex(captchaKey, 300, captcha.text.toLowerCase());
    
    logger.debug(`生成验证码 - ID: ${captchaId}`);
    
    res.json({
      code: 200,
      data: {
        captchaKey: captchaId,
        captchaUrl: `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`,
        expiresIn: 300
      }
    });
  } catch (error) {
    logger.error('生成验证码错误:', error);
    res.status(500).json({ code: 500, msg: '生成验证码失败' });
  }
};

// 验证验证码
const verifyCaptcha = async (req, res) => {
  try {
    const { captchaKey, captcha } = req.body;
    
    if (!captchaKey || !captcha) {
      return res.json({ code: 400, valid: false, msg: '验证码不能为空' });
    }
    
    const storedCaptcha = await redis.get(`captcha:${captchaKey}`);
    
    if (!storedCaptcha) {
      return res.json({ code: 400, valid: false, msg: '验证码已过期' });
    }
    
    const isValid = storedCaptcha === captcha.toLowerCase();
    
    res.json({
      code: 200,
      valid: isValid,
      msg: isValid ? '验证成功' : '验证码错误'
    });
  } catch (error) {
    logger.error('验证验证码错误:', error);
    res.status(500).json({ code: 500, msg: '验证失败' });
  }
};

module.exports = {
  generateCaptcha,
  verifyCaptcha
};