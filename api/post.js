import request from '@/utils/request'

export const createPost = (data) => request({ url: '/post', method: 'post', data })
export const getPostList = (params) => request({ url: '/post/list', method: 'get', params })
export const getPostDetail = (id) => request({ url: `/post/${id}`, method: 'get' })
export const updatePost = (id, data) => request({ url: `/post/${id}`, method: 'put', data })
export const deletePost = (id) => request({ url: `/post/${id}`, method: 'delete' })
export const toggleLike = (id) => request({ url: `/post/${id}/like`, method: 'post' })