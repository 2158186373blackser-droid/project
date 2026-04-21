import request from '@/utils/request'

export const publishOrder = (data) => {
  return request({ url: '/order/publish', method: 'post', data })
}

export const getOrderList = (params) => {
  return request({ url: '/order/list', method: 'get', params })
}

export const getOrderDetail = (id) => {
  return request({ url: `/order/${id}`, method: 'get' })
}

export const acceptOrder = (id) => {
  return request({ url: `/order/${id}/accept`, method: 'post' })
}

export const confirmPickup = (id) => {
  return request({ url: `/order/${id}/pickup`, method: 'post' })
}

export const confirmDelivery = (id) => {
  return request({ url: `/order/${id}/delivery`, method: 'post' })
}

export const confirmComplete = (id) => {
  return request({ url: `/order/${id}/complete`, method: 'post' })
}

export const fileComplaint = (id, reason) => {
  return request({ url: `/order/${id}/complaint`, method: 'post', data: { reason } })
}