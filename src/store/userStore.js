import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginAPI, getUserInfo, logout as logoutAPI } from '@/api/auth'
import router from '@/router'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  const isLoggedIn = computed(() => !!token.value)
  
  // 设置Token
  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }
  
  // 清除Token
  const clearToken = () => {
    token.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }
  
  // 登录
  const login = async (credentials) => {
    try {
      const res = await loginAPI(credentials)
      
      setToken(res.data.token)
      if (res.data.refreshToken) {
        localStorage.setItem('refreshToken', res.data.refreshToken)
      }
      
      userInfo.value = res.data.user
      
      ElMessage.success('登录成功')
      
      const redirect = router.currentRoute.value.query.redirect || '/dashboard'
      router.push(redirect)
      
      return { success: true }
    } catch (error) {
      if (error.requireCaptcha) {
        return {
          success: false,
          requireCaptcha: true,
          remainAttempts: error.remainAttempts,
          message: error.message
        }
      }
      
      return {
        success: false,
        message: error.message || '登录失败'
      }
    }
  }
  
  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const res = await getUserInfo()
      userInfo.value = res.data
      return userInfo.value
    } catch (error) {
      console.error('获取用户信息失败:', error)
      if (error.response?.status === 401) {
        clearToken()
        router.push('/login')
      }
      throw error
    }
  }
  
  // 退出登录
  const logout = async () => {
    try {
      await logoutAPI()
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      clearToken()
      userInfo.value = null
      router.push('/login')
      ElMessage.success('已退出登录')
    }
  }
  
  return {
    token,
    userInfo,
    isLoggedIn,
    setToken,
    clearToken,
    login,
    logout,
    fetchUserInfo
  }
})