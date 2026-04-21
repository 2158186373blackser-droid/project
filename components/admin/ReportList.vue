<template>
  <el-card>
    <template #header>举报管理</template>
    <el-tabs v-model="statusFilter" @tab-change="fetchData">
      <el-tab-pane label="待处理" name="pending" />
      <el-tab-pane label="已处理" name="processed" />
    </el-tabs>
    <el-table :data="reports" v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="targetType" label="类型" width="80" />
      <el-table-column label="内容摘要" show-overflow-tooltip>
        <template #default="{ row }">{{ row.contentSnapshot || row.targetId }}</template>
      </el-table-column>
      <el-table-column prop="reporter.username" label="举报人" width="100" />
      <el-table-column prop="reportedUser.username" label="被举报人" width="100" />
      <el-table-column prop="reason" label="理由" width="100" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button type="primary" link @click="$router.push(`/admin/report/${row.id}`)">处理</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" :total="total" @current-change="fetchData" />
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getReportList } from '@/api/admin/report';
const loading = ref(false);
const reports = ref([]);
const page = ref(1);
const total = ref(0);
const statusFilter = ref('pending');

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getReportList({ status: statusFilter.value, page: page.value });
    reports.value = res.data.list;
    total.value = res.data.total;
  } finally { loading.value = false; }
};

onMounted(fetchData);
</script>