import request from '@/utils/request';
export const getUserList = (params) => request({ url: '/admin/users', method: 'get', params });
export const banUser = (id, data) => request({ url: `/admin/users/${id}/ban`, method: 'post', data });
export const unbanUser = (id) => request({ url: `/admin/users/${id}/unban`, method: 'post' });