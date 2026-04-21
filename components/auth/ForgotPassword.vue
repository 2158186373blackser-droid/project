<template>
  <div class="forgot-password-container">
    <el-card class="forgot-card" shadow="hover">
      <div class="card-header">
        <h2>找回密码</h2>
        <p>请输入您的注册邮箱，我们将发送重置链接</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="注册邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入您的 .edu.cn 邮箱"
            prefix-icon="Message"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item label="验证码" prop="captcha">
          <div class="captcha-wrapper">
            <el-input
              v-model="form.captcha"
              placeholder="请输入验证码"
              size="large"
              style="flex: 1"
            />
            <div class="captcha-img" @click="refreshCaptcha">
              <img v-if="captchaUrl" :src="captchaUrl" alt="验证码" />
              <span v-else>点击获取</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleSubmit"
          >
            {{ loading ? '发送中...' : '发送重置邮件' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="footer-links">
        <el-link type="primary" @click="goToLogin">返回登录</el-link>
        <el-link type="primary" @click="goToRegister">立即注册</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCaptcha } from '@/api/captcha'
import { requestPasswordReset } from '@/api/auth'  // 该接口待实现，目前仅模拟

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const captchaUrl = ref('')
const captchaKey = ref('')

const form = reactive({
  email: '',
  captcha: ''
})

const rules = {
  email: [
    { required: true, message: '请输入注册邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
    { pattern: /\.edu\.cn$/, message: '必须使用 .edu.cn 邮箱', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

// 获取验证码
const fetchCaptcha = async () => {
  try {
    const res = await getCaptcha({ type: 'forgot' })
    captchaKey.value = res.data.captchaKey
    captchaUrl.value = res.data.captchaUrl
  } catch (error) {
    ElMessage.error('获取验证码失败')
  }
}

const refreshCaptcha = async () => {
  form.captcha = ''
  await fetchCaptcha()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      // 调用后端发送重置邮件接口（目前可能未实现，可先模拟成功）
      await requestPasswordReset({
        email: form.email,
        captcha: form.captcha,
        captchaKey: captchaKey.value
      })
      ElMessage.success('重置邮件已发送，请查收邮箱（模拟提示）')
      // 实际应用中可能跳转到提示页面
    } catch (error) {
      ElMessage.error(error.message || '发送失败，请稍后重试')
      refreshCaptcha()
    } finally {
      loading.value = false
    }
  })
}

const goToLogin = () => router.push('/login')
const goToRegister = () => router.push('/register')

onMounted(() => {
  fetchCaptcha()
})
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.forgot-card {
  width: 100%;
  max-width: 450px;
  border-radius: 12px;
}

.forgot-card :deep(.el-card__body) {
  padding: 40px;
}

.card-header {
  text-align: center;
  margin-bottom: 30px;
}

.card-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.card-header p {
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

.footer-links {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}
</style>