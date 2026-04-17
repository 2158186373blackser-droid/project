import md5 from 'js-md5';

// MD5加密
export const md5Encrypt = (str) => {
  return md5(str);
};

// Base64编码
export const base64Encode = (str) => {
  return btoa(encodeURIComponent(str));
};

// Base64解码
export const base64Decode = (str) => {
  return decodeURIComponent(atob(str));
};

// 生成随机字符串
export const randomString = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};