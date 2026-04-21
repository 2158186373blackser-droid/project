<template>
  <el-card>
    <template #header>用户管理</template>
    <div class="search-bar">
      <el-input v-model="keyword" placeholder="用户名/邮箱" style="width: 240px" clearable @keyup.enter="fetchUsers" />
      <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 120px" @change="fetchUsers">
        <el-option label="正常" value="active" />
        <el-option label="已封禁" value="locked" />
      </el-select>
      <el-button type="primary" @click="fetchUsers">搜索</el-button>
    </div>

    <el-table :data="users" v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '正常' : '已封禁' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="爽约次数" width="100">
        <template #default="{ row }">{{ row.UserCredit?.absentCount || 0 }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button v-if="row.status === 'active'" type="danger" link @click="handleBan(row)">封禁</el-button>
          <el-button v-else type="success" link @click="handleUnban(row)">解封</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next"
      @current-change="fetchUsers"
    />
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUserList, banUser, unbanUser } from '@/api/admin/user';

const loading = ref(false);
const users = ref([]);
const keyword = ref('');
const statusFilter = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await getUserList({ keyword: keyword.value, status: statusFilter.value, page: page.value, pageSize: pageSize.value });
    users.value = res.data.list;
    total.value = res.data.total;
  } finally { loading.value = false; }
};

const handleBan = async (row) => {
  const days = await ElMessageBox.prompt('封禁天数', '封禁用户', { type: 'warning', inputPattern: /^\d+$/, inputErrorMessage: '请输入数字' }).then(({ value }) => value).catch(() => null);
  if (!days) return;
  await banUser(row.id, { banDays: parseInt(days) });
  ElMessage.success('封禁成功');
  fetchUsers();
};

const handleUnban = async (row) => {
  await ElMessageBox.confirm('确定解封该用户？', '解封确认', { type: 'warning' });
  await unbanUser(row.id);
  ElMessage.success('解封成功');
  fetchUsers();
};

onMounted(fetchUsers);
</script>

<style scoped>
.search-bar { display: flex; gap: 12px; margin-bottom: 20px; }
</style>