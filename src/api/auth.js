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