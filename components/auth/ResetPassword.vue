<template>
  <div class="reset-password-container">
    <el-card class="reset-card" shadow="hover">
      <div class="card-header">
        <h2>重置密码</h2>
        <p>请设置您的新密码</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="至少8位，包含字母和数字"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleSubmit"
          >
            {{ loading ? '提交中...' : '确认重置' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="footer-links">
        <el-link type="primary" @click="goToLogin">返回登录</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { resetPassword } from '@/api/auth'  // 待实现

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少为8位', trigger: 'blur' },
    { pattern: /[a-zA-Z]/, message: '必须包含字母', trigger: 'blur' },
    { pattern: /\d/, message: '必须包含数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const token = route.query.token
      if (!token) {
        ElMessage.error('无效的重置链接')
        return
      }
      await resetPassword({
        token,
        newPassword: form.password
      })
      ElMessage.success('密码重置成功，请登录')
      router.push('/login')
    } catch (error) {
      ElMessage.error(error.message || '重置失败，请稍后重试')
    } finally {
      loading.value = false
    }
  })
}

const goToLogin = () => router.push('/login')
</script>

<style scoped>
.reset-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.reset-card {
  width: 100%;
  max-width: 450px;
  border-radius: 12px;
}

.reset-card :deep(.el-card__body) {
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

.footer-links {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>