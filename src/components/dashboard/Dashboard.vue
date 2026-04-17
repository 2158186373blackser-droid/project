<template>
  <div class="dashboard">
    <el-container>
      <el-header class="dashboard-header">
        <div class="header-left">
          <h2>用户控制台</h2>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="40" :icon="UserFilled" />
              <span class="username">{{ userInfo?.username || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="settings">账号设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-container>
        <el-aside width="250px" class="dashboard-sidebar">
          <el-menu
            :default-active="activeMenu"
            router
            class="sidebar-menu"
          >
            <el-menu-item index="/dashboard">
              <el-icon><HomeFilled /></el-icon>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/profile">
              <el-icon><User /></el-icon>
              <span>个人资料</span>
            </el-menu-item>
            <el-menu-item index="/security">
              <el-icon><Lock /></el-icon>
              <span>安全设置</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        
        <el-main class="dashboard-main">
          <el-card class="welcome-card">
            <h3>欢迎回来，{{ userInfo?.username }}！</h3>
            <p>这是您的用户控制台，您可以在这里管理您的账号信息。</p>
          </el-card>
          
          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="8">
              <el-card class="stat-card">
                <div class="stat-icon" style="background: #e6f7ff">
                  <el-icon :size="32" color="#1890ff"><User /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-label">账号状态</div>
                  <div class="stat-value">
                    <el-tag :type="userInfo?.status === 'active' ? 'success' : 'danger'">
                      {{ userInfo?.status === 'active' ? '正常' : '已锁定' }}
                    </el-tag>
                  </div>
                </div>
              </el-card>
            </el-col>
            
            <el-col :span="8">
              <el-card class="stat-card">
                <div class="stat-icon" style="background: #f6ffed">
                  <el-icon :size="32" color="#52c41a"><Message /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-label">绑定邮箱</div>
                  <div class="stat-value">{{ userInfo?.email || '未绑定' }}</div>
                </div>
              </el-card>
            </el-col>
            
            <el-col :span="8">
              <el-card class="stat-card">
                <div class="stat-icon" style="background: #fff7e6">
                  <el-icon :size="32" color="#faad14"><Clock /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-label">最后登录</div>
                  <div class="stat-value">{{ formatTime(userInfo?.lastLoginAt) }}</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
          
          <el-card class="info-card" style="margin-top: 20px">
            <template #header>
              <span>系统信息</span>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="用户ID">{{ userInfo?.id }}</el-descriptions-item>
              <el-descriptions-item label="用户名">{{ userInfo?.username }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ userInfo?.email }}</el-descriptions-item>
              <el-descriptions-item label="注册时间">{{ formatTime(userInfo?.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="最后登录IP">{{ userInfo?.lastLoginIp || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
          
          <el-card class="feature-card" style="margin-top: 20px">
            <template #header>
              <span>系统功能</span>
            </template>
            <el-row :gutter="20">
              <el-col :span="6" v-for="feature in features" :key="feature.title">
                <div class="feature-item">
                  <el-icon :size="40" :color="feature.color">
                    <component :is="feature.icon" />
                  </el-icon>
                  <h4>{{ feature.title }}</h4>
                  <p>{{ feature.desc }}</p>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  UserFilled, ArrowDown, HomeFilled, User, Lock,
  Message, Clock, Setting, Document, Picture, Monitor
} from '@element-plus/icons-vue'
import { useAuth } from '@/composables/useAuth'
import dayjs from 'dayjs'

const router = useRouter()
const { userInfo, logout, fetchUserInfo } = useAuth()
const activeMenu = ref('/dashboard')

const features = [
  { title: '个人资料', desc: '管理您的个人信息', icon: 'User', color: '#1890ff' },
  { title: '安全设置', desc: '修改密码和安全设置', icon: 'Lock', color: '#52c41a' },
  { title: '消息中心', desc: '查看系统消息', icon: 'Message', color: '#faad14' },
  { title: '系统设置', desc: '个性化系统配置', icon: 'Setting', color: '#722ed1' }
]

const formatTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        logout()
      }).catch(() => {})
      break
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style lang="scss" scoped>
.dashboard {
  height: 100vh;
  
  .dashboard-header {
    background: #fff;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    
    .header-left h2 {
      color: #333;
      font-size: 20px;
    }
    
    .header-right {
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 4px;
        
        &:hover {
          background: #f5f5f5;
        }
        
        .username {
          font-size: 14px;
          color: #333;
        }
      }
    }
  }
  
  .dashboard-sidebar {
    background: #fff;
    border-right: 1px solid #e8e8e8;
    
    .sidebar-menu {
      border-right: none;
      height: 100%;
    }
  }
  
  .dashboard-main {
    background: #f5f7fa;
    padding: 24px;
    
    .welcome-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      
      h3 {
        margin-bottom: 8px;
      }
      
      p {
        opacity: 0.9;
      }
    }
    
    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      
      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
      }
      
      .stat-info {
        flex: 1;
        
        .stat-label {
          font-size: 14px;
          color: #999;
          margin-bottom: 8px;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #333;
        }
      }
    }
    
    .feature-item {
      text-align: center;
      padding: 20px;
      
      h4 {
        margin: 12px 0 8px;
        color: #333;
      }
      
      p {
        font-size: 12px;
        color: #999;
      }
    }
  }
}
</style>