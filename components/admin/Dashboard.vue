<template>
  <div class="admin-dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon"><el-icon :size="32"><User /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon"><el-icon :size="32"><Document /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalPosts }}</div>
            <div class="stat-label">总帖子数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon"><el-icon :size="32"><Warning /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pendingReports }}</div>
            <div class="stat-label">待处理举报</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon"><el-icon :size="32"><Goods /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.onlineGoods }}</div>
            <div class="stat-label">在线商品</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>最近举报</template>
          <el-table :data="recentReports" v-loading="loading">
            <el-table-column prop="targetType" label="类型" width="80" />
            <el-table-column prop="reporter.username" label="举报人" width="100" />
            <el-table-column prop="reason" label="理由" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'pending' ? 'warning' : 'info'">
                  {{ row.status === 'pending' ? '待处理' : '已处理' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>系统快捷操作</template>
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/admin/reports')">处理举报</el-button>
            <el-button type="warning" @click="$router.push('/admin/users')">管理用户</el-button>
            <el-button @click="$router.push('/admin/logs')">查看操作日志</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { User, Document, Warning, Goods } from '@element-plus/icons-vue';
import { getAdminStats } from '@/api/admin/dashboard';
import { getReportList } from '@/api/admin/report';

const stats = ref({ totalUsers: 0, totalPosts: 0, pendingReports: 0, onlineGoods: 0 });
const recentReports = ref([]);
const loading = ref(false);

const fetchStats = async () => {
  try {
    const res = await getAdminStats();
    stats.value = res.data;
  } catch (e) { console.error(e); }
};

const fetchReports = async () => {
  loading.value = true;
  try {
    const res = await getReportList({ status: 'pending', page: 1, pageSize: 5 });
    recentReports.value = res.data.list;
  } finally { loading.value = false; }
};

onMounted(() => { fetchStats(); fetchReports(); });
</script>

<style scoped>
.stat-card { display: flex; align-items: center; padding: 20px; }
.stat-icon { width: 60px; height: 60px; border-radius: 12px; background: #e6f7ff; display: flex; align-items: center; justify-content: center; margin-right: 16px; }
.stat-content { flex: 1; }
.stat-value { font-size: 28px; font-weight: bold; }
.stat-label { color: #999; margin-top: 4px; }
.quick-actions { display: flex; gap: 12px; flex-wrap: wrap; }
</style>