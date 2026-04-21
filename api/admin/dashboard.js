import request from '@/utils/request';
export const getAdminStats = () => request({ url: '/admin/dashboard/stats', method: 'get' });
export const getOperationLogs = (params) => request({ url: '/admin/logs', method: 'get', params });