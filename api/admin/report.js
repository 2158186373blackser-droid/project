import request from '@/utils/request';
export const getReportList = (params) => request({ url: '/admin/reports', method: 'get', params });
export const getReportDetail = (id) => request({ url: `/admin/reports/${id}`, method: 'get' });
export const handleReport = (id, data) => request({ url: `/admin/reports/${id}/handle`, method: 'post', data });