<template>
  <div class="profile">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>个人资料</span>
        </div>
      </template>
      
      <el-descriptions :column="1" border>
        <el-descriptions-item label="用户名">{{ userInfo?.username }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ userInfo?.email }}</el-descriptions-item>
        <el-descriptions-item label="账号状态">
          <el-tag :type="userInfo?.status === 'active' ? 'success' : 'danger'">
            {{ userInfo?.status === 'active' ? '正常' : '已锁定' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatTime(userInfo?.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="最后登录">{{ formatTime(userInfo?.lastLoginAt) }}</el-descriptions-item>
        <el-descriptions-item label="最后登录IP">{{ userInfo?.lastLoginIp || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import dayjs from 'dayjs'

const { userInfo, fetchUserInfo } = useAuth()

const formatTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.profile {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>