import request from '@/utils/request';

// 用户注册
export const register = (data) => {
  return request({
    url: '/register',
    method: 'post',
    data
  });
};

// 用户登录
export const login = (data) => {
  return request({
    url: '/login',
    method: 'post',
    data
  });
};

// 获取用户信息
export const getUserInfo = () => {
  return request({
    url: '/user/info',
    method: 'get'
  });
};

// 退出登录
export const logout = () => {
  return request({
    url: '/logout',
    method: 'post'
  });
};

// 修改密码
export const changePassword = (data) => {
  return request({
    url: '/change-password',
    method: 'post',
    data
  });
};

// 刷新Token
export const refreshToken = (data) => {
  return request({
    url: '/refresh-token',
    method: 'post',
    data
  });
};
// 请求发送重置密码邮件
export const requestPasswordReset = (data) => {
  return request({ url: '/auth/forgot-password', method: 'post', data })
}

// 重置密码
export const resetPassword = (data) => {
  return request({ url: '/auth/reset-password', method: 'post', data })
}