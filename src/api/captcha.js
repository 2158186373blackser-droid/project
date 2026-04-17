import request from '@/utils/request'

// 获取验证码
export const getCaptcha = (params) => {
  return request({
    url: '/captcha',
    method: 'get',
    params
  })
}

// 验证验证码
export const verifyCaptcha = (data) => {
  return request({
    url: '/captcha/verify',
    method: 'post',
    data
  })
}

// 刷新验证码
export const refreshCaptcha = (data) => {
  return request({
    url: '/captcha/refresh',
    method: 'post',
    data
  })
}