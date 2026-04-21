import request from '@/utils/request'

export const getCommentList = (postId, params) => request({ url: `/post/${postId}/comment`, method: 'get', params })
export const createComment = (postId, data) => request({ url: `/post/${postId}/comment`, method: 'post', data })
export const deleteComment = (id) => request({ url: `/post/comment/${id}`, method: 'delete' })
export const reportComment = (id, data) => request({ url: `/post/comment/${id}/report`, method: 'post', data })