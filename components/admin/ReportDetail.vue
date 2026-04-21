<template>
  <el-card v-loading="loading">
    <template #header>举报详情 #{{ report.id }}</template>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="举报人">{{ report.reporter?.username }}</el-descriptions-item>
      <el-descriptions-item label="被举报人">{{ report.reportedUser?.username }}</el-descriptions-item>
      <el-descriptions-item label="类型">{{ report.targetType }}</el-descriptions-item>
      <el-descriptions-item label="理由">{{ report.reason }}</el-descriptions-item>
      <el-descriptions-item label="内容快照" :span="2">{{ report.contentSnapshot }}</el-descriptions-item>
    </el-descriptions>
    
    <el-divider>完整内容</el-divider>
    <div v-if="targetContent" class="content-box">
      <h4>{{ targetContent.title || '内容详情' }}</h4>
      <p>{{ targetContent.content || targetContent.description }}</p>
    </div>
    
    <el-divider>处理操作</el-divider>
    <el-form label-width="100px">
      <el-form-item label="处理动作">
        <el-radio-group v-model="action">
          <el-radio value="delete_content">仅删除内容</el-radio>
          <el-radio value="ban_user">仅封禁用户</el-radio>
          <el-radio value="both">删除并封禁</el-radio>
          <el-radio value="ignore">忽略举报</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="封禁天数" v-if="action === 'ban_user' || action === 'both'">
        <el-input-number v-model="banDays" :min="1" :max="30" />
      </el-form-item>
      <el-form-item label="处理说明">
        <el-input v-model="handleReason" type="textarea" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
        <el-button @click="$router.back()">返回</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getReportDetail, handleReport } from '@/api/admin/report';
import { ElMessage } from 'element-plus';

const route = useRoute(); const router = useRouter();
const loading = ref(false);
const report = ref({});
const targetContent = ref(null);
const action = ref('delete_content');
const banDays = ref(7);
const handleReason = ref('');

const fetchDetail = async () => {
  loading.value = true;
  try {
    const res = await getReportDetail(route.params.id);
    report.value = res.data.report;
    targetContent.value = res.data.targetContent;
  } finally { loading.value = false; }
};

const submitHandle = async () => {
  await handleReport(route.params.id, { action: action.value, reason: handleReason.value, banDays: banDays.value });
  ElMessage.success('处理完成');
  router.push('/admin/reports');
};

onMounted(fetchDetail);
</script>