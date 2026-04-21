<template>
  <div class="register-container">
    <el-card class="register-card" shadow="hover">
      <div class="register-header">
        <h2>用户注册</h2>
        <p>创建您的账号，开始使用系统</p>
      </div>
      
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="3-20位字母、数字或下划线"
            prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请使用.edu.cn邮箱"
            prefix-icon="Message"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="至少8位，包含字母和数字"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item label="验证码" prop="captcha">
          <div class="captcha-wrapper">
            <el-input
              v-model="registerForm.captcha"
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

        <el-form-item prop="agree">
          <el-checkbox v-model="registerForm.agree">
            我已阅读并同意《用户协议》和《隐私政策》
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            :disabled="!registerForm.agree"
            style="width: 100%"
            @click="handleRegister"
          >
            {{ loading ? '注册中...' : '注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <span>已有账号？</span>
        <el-link type="primary" @click="goToLogin">立即登录</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import md5 from 'js-md5'
import { register as registerAPI } from '@/api/auth'
import { useCaptcha } from '@/composables/useCaptcha'

const router = useRouter()
const { captchaUrl, captchaKey, captchaCode, fetchCaptcha, refreshCaptcha } = useCaptcha()

const registerFormRef = ref(null)
const loading = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  captcha: '',
  agree: false
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在3-20个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少为8位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

const goToLogin = () => {
  router.push('/login')
}

const handleRefreshCaptcha = async () => {
  try {
    await refreshCaptcha()
    registerForm.captcha = ''
  } catch (error) {
    ElMessage.error('获取验证码失败')
  }
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    
    try {
      const encryptedPassword = md5(registerForm.password)
      
      await registerAPI({
        username: registerForm.username.trim(),
        email: registerForm.email,
        password: encryptedPassword,
        captcha: registerForm.captcha,
        captchaKey: captchaKey.value
      })
      
      ElMessage.success('注册成功，即将跳转登录页')
      
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (error) {
      console.error('注册失败:', error)
      await handleRefreshCaptcha()
    } finally {
      loading.value = false
    }
  })
}

watch(() => registerForm.captcha, (val) => {
  captchaCode.value = val
})

onMounted(() => {
  fetchCaptcha()
})
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
}

.register-card :deep(.el-card__body) {
  padding: 40px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.register-header p {
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

.register-footer {
  text-align: center;
  margin-top: 20px;
}

.register-footer span {
  color: #666;
  margin-right: 8px;
}
</style>