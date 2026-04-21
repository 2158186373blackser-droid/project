import request from '@/utils/request';

export const getGoodsList = (params) => request({ url: '/goods/list', method: 'get', params });
export const getGoodsDetail = (id) => request({ url: `/goods/${id}`, method: 'get' });
export const publishGoods = (data) => request({ url: '/goods/publish', method: 'post', data });
export const buyGoods = (id) => request({ url: `/goods/${id}/buy`, method: 'post' });
export const shelveGoods = (id) => request({ url: `/goods/${id}/shelve`, method: 'post' });