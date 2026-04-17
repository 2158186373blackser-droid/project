import { ref } from 'vue'
import { getCaptcha, verifyCaptcha as verifyCaptchaAPI } from '@/api/captcha'

export const useCaptcha = () => {
  const captchaKey = ref('')
  const captchaUrl = ref('')
  const captchaCode = ref('')
  const loading = ref(false)
  
  // 获取验证码
  const fetchCaptcha = async (type = 'register') => {
    loading.value = true
    
    try {
      const res = await getCaptcha({ type })
      captchaKey.value = res.data.captchaKey
      captchaUrl.value = res.data.captchaUrl
      return res.data
    } catch (error) {
      console.error('获取验证码失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  // 刷新验证码
  const refreshCaptcha = async () => {
    captchaCode.value = ''
    await fetchCaptcha()
  }
  
  // 验证验证码
  const verifyCaptcha = async () => {
    if (!captchaKey.value || !captchaCode.value) {
      return false
    }
    
    try {
      const res = await verifyCaptchaAPI({
        captchaKey: captchaKey.value,
        captcha: captchaCode.value
      })
      return res.valid
    } catch (error) {
      console.error('验证验证码失败:', error)
      return false
    }
  }
  
  // 清空验证码
  const clearCaptcha = () => {
    captchaKey.value = ''
    captchaUrl.value = ''
    captchaCode.value = ''
  }
  
  return {
    captchaKey,
    captchaUrl,
    captchaCode,
    loading,
    fetchCaptcha,
    refreshCaptcha,
    verifyCaptcha,
    clearCaptcha
  }
}