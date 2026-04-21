import request from '@/utils/request'

export const getSeats = (params) => request({ url: '/library/seats', method: 'get', params })
export const bookSeat = (data) => request({ url: '/library/book', method: 'post', data })
export const checkIn = (id) => request({ url: `/library/checkin/${id}`, method: 'post' })
export const cancelBooking = (id) => request({ url: `/library/cancel/${id}`, method: 'post' })
export const getMyBookings = () => request({ url: '/library/my', method: 'get' })
export const getCredit = () => request({ url: '/library/credit', method: 'get' })
export const submitAppeal = (data) => request({ url: '/library/appeal', method: 'post', data })