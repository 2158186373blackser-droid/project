<template>
  <div class="post-publish">
    <el-card>
      <template #header><h3>发布帖子</h3></template>
      
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="100" show-word-limit placeholder="请输入标题（最多100字）" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="8" maxlength="5000" show-word-limit placeholder="请输入内容（最多5000字）" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">发布</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createPost } from '@/api/post'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  title: '',
  content: ''
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const res = await createPost(form)
      ElMessage.success(res.msg)
      router.push('/forum/list')
    } catch (error) {
      ElMessage.error(error.message || '发布失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.post-publish { max-width: 800px; margin: 0 auto; }
</style>