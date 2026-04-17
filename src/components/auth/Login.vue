<template>
  <div class="login-container">
    <el-card class="login-card" shadow="hover">
      <div class="login-header">
        <h2>用户登录</h2>
        <p>欢迎回来，请登录您的账号</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="账号" prop="account">
          <el-input
            v-model="loginForm.account"
            placeholder="请输入用户名或邮箱"
            prefix-icon="User"
            size="large"
            clearable
            @blur="loginForm.account = loginForm.account.trim()"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item v-if="showCaptcha" label="验证码" prop="captcha">
          <div class="captcha-wrapper">
            <el-input
              v-model="loginForm.captcha"
              placeholder="请输入验证码"
              size="large"
              style="flex: 1"
            />
            <div class="captcha-img" @click="handleRefreshCaptcha">
              <img v-if="captchaUrl" :src="captchaUrl" alt="验证码" />
              <span v-else>点击获取</span>
            </div>
          </div>
        </el-form-item>

        <div v-if="remainAttempts < 5 && remainAttempts > 0" class="attempts-tip">
          <el-alert
            :title="`账号或密码错误，你还有 ${remainAttempts} 次尝试机会`"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>

        <div class="form-options">
          <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
          <el-link type="primary" @click="handleForgotPassword">忘记密码？</el-link>
        </div>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            :disabled="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <span>还没有账号？</span>
        <el-link type="primary" @click="goToRegister">立即注册</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import md5 from 'js-md5'
import { useAuth } from '@/composables/useAuth'
import { useCaptcha } from '@/composables/useCaptcha'

const router = useRouter()
const { login: authLogin } = useAuth()
const { captchaUrl, captchaKey, captchaCode, fetchCaptcha, refreshCaptcha } = useCaptcha()

const loginFormRef = ref(null)
const loading = ref(false)
const showCaptcha = ref(false)
const remainAttempts = ref(5)
const rememberMe = ref(false)

const loginForm = reactive({
  account: '',
  password: '',
  captcha: ''
})

const rules = {
  account: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const goToRegister = () => {
  router.push('/register')
}

const handleRefreshCaptcha = async () => {
  try {
    await refreshCaptcha()
    loginForm.captcha = ''
  } catch (error) {
    ElMessage.error('获取验证码失败')
  }
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    
    try {
      const encryptedPassword = md5(loginForm.password)
      
      const loginData = {
        account: loginForm.account.trim(),
        password: encryptedPassword
      }
      
      if (showCaptcha.value) {
        loginData.captcha = loginForm.captcha
        loginData.captchaKey = captchaKey.value
      }
      
      const result = await authLogin(loginData)
      
      if (!result.success) {
        if (result.requireCaptcha) {
          showCaptcha.value = true
          remainAttempts.value = result.remainAttempts
          
          if (!captchaUrl.value) {
            await fetchCaptcha()
          } else {
            await handleRefreshCaptcha()
          }
        } else {
          remainAttempts.value = result.remainAttempts || 0
        }
        
        loginForm.captcha = ''
      }
    } catch (error) {
      console.error('登录失败:', error)
      loginForm.captcha = ''
      if (showCaptcha.value) {
        await handleRefreshCaptcha()
      }
    } finally {
      loading.value = false
    }
  })
}

const handleForgotPassword = () => {
  ElMessage.info('请联系管理员重置密码')
}

watch(() => loginForm.captcha, (val) => {
  captchaCode.value = val
})

onMounted(() => {
  const savedAccount = localStorage.getItem('rememberedAccount')
  if (savedAccount) {
    loginForm.account = savedAccount
    rememberMe.value = true
  }
})

watch(rememberMe, (val) => {
  if (val) {
    localStorage.setItem('rememberedAccount', loginForm.account)
  } else {
    localStorage.removeItem('rememberedAccount')
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 450px;
  border-radius: 12px;
}

.login-card :deep(.el-card__body) {
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.login-header p {
  color: #666;
  font-size: 14px;
}

.captcha-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-img {
  width: 120px;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  overflow: hidden;
  flex-shrink: 0;
}

.captcha-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-img:hover {
  border-color: #409eff;
}

.attempts-tip {
  margin-bottom: 18px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}

.login-footer span {
  color: #666;
  margin-right: 8px;
}
</style>