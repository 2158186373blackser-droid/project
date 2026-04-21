import request from '@/utils/request'
export const getWallet = () => request({ url: '/wallet', method: 'get' })
export const getTransactions = () => request({ url: '/wallet/transactions', method: 'get' })