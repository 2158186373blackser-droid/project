import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

// 创建axios实例
const service = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 15000,
  withCredentials: false
});

// 是否正在刷新Token
let isRefreshing = false;
// 刷新Token期间的请求队列
let requests = [];

// 处理刷新Token后的请求
const processQueue = (error, token = null) => {
  requests.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  requests = [];
};

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 处理FormData
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data;
    
    // 直接返回响应数据
    if (res.code === 200) {
      return res;
    }
    
    // 处理业务错误
    ElMessage.error(res.msg || '请求失败');
    return Promise.reject({ ...res, message: res.msg });
  },
  async error => {
    console.error('响应错误:', error);
    
    const originalRequest = error.config;
    
    // 处理Token过期
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新Token，将请求加入队列
        return new Promise((resolve, reject) => {
          requests.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return service(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // 刷新Token
          const { data } = await service.post('/refresh-token', { refreshToken });
          
          localStorage.setItem('token', data.token);
          service.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          
          // 处理队列中的请求
          processQueue(null, data.token);
          
          // 重试原请求
          originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
          return service(originalRequest);
        } catch (err) {
          processQueue(err, null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          router.push('/login');
          ElMessage.error('登录已过期，请重新登录');
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      } else {
        // 没有刷新Token，直接跳转登录
        localStorage.removeItem('token');
        router.push('/login');
        ElMessage.error('登录已过期，请重新登录');
      }
    }
    
    // 处理其他HTTP错误
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 403:
          ElMessage.error(data.msg || '没有权限访问');
          break;
        case 429:
          ElMessage.warning(data.msg || '请求过于频繁，请稍后再试');
          break;
        case 500:
          ElMessage.error('服务器错误，请稍后再试');
          break;
        default:
          ElMessage.error(data.msg || `请求失败 (${status})`);
      }
      
      return Promise.reject({ ...data, status });
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接');
      return Promise.reject({ message: '网络错误' });
    } else {
      ElMessage.error(error.message || '请求失败');
      return Promise.reject(error);
    }
  }
);

export default service;