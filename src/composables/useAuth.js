import { ref } from 'vue'
import { useUserStore } from '@/store/userStore'
import { storeToRefs } from 'pinia'

export const useAuth = () => {
  const userStore = useUserStore()
  const { userInfo, isLoggedIn } = storeToRefs(userStore)
  
  const loading = ref(false)
  const error = ref(null)
  
  // 登录
  const login = async (credentials) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await userStore.login(credentials)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 退出登录
  const logout = async () => {
    loading.value = true
    
    try {
      await userStore.logout()
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }
  
  return {
    userInfo,
    isLoggedIn,
    loading,
    error,
    login,
    logout,
    fetchUserInfo: userStore.fetchUserInfo
  }
}