<template>
  <el-card>
    <template #header>操作日志</template>
    <el-table :data="logs" v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="adminUsername" label="操作管理员" width="120" />
      <el-table-column prop="operationType" label="操作类型" width="140">
        <template #default="{ row }">{{ getOperationTypeText(row.operationType) }}</template>
      </el-table-column>
      <el-table-column prop="targetType" label="目标类型" width="100" />
      <el-table-column prop="targetId" label="目标ID" width="80" />
      <el-table-column prop="ipAddress" label="IP地址" width="140" />
      <el-table-column prop="createdAt" label="操作时间" width="180">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="详情" width="80">
        <template #default="{ row }">
          <el-button link type="primary" @click="showDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next"
      @current-change="fetchLogs"
    />

    <el-dialog v-model="dialogVisible" title="操作详情" width="600px">
      <pre>{{ detailContent }}</pre>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getOperationLogs } from '@/api/admin/dashboard';
import dayjs from 'dayjs';

const loading = ref(false);
const logs = ref([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const dialogVisible = ref(false);
const detailContent = ref('');

const getOperationTypeText = (type) => {
  const map = { delete_post: '删除帖子', delete_comment: '删除评论', ban_user: '封禁用户', unban_user: '解封用户', handle_report: '处理举报', shelve_goods: '下架商品' };
  return map[type] || type;
};

const formatTime = (t) => dayjs(t).format('YYYY-MM-DD HH:mm:ss');

const fetchLogs = async () => {
  loading.value = true;
  try {
    const res = await getOperationLogs({ page: page.value, pageSize: pageSize.value });
    logs.value = res.data.list;
    total.value = res.data.total;
  } finally { loading.value = false; }
};

const showDetail = (row) => {
  detailContent.value = JSON.stringify({ before: row.beforeSnapshot, after: row.afterSnapshot }, null, 2);
  dialogVisible.value = true;
};

onMounted(fetchLogs);
</script>