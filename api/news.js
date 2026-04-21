import request from '@/utils/request'

export const getNewsList = (params) => {
  return request({ url: '/news/list', method: 'get', params })
}

export const getNewsDetail = (id) => {
  return request({ url: `/news/${id}`, method: 'get' })
}