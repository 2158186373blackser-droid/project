<template>
  <div class="post-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>论坛广场</span>
          <el-button type="primary" @click="$router.push('/forum/publish')">发布帖子</el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input v-model="keyword" placeholder="搜索帖子" style="width: 300px" clearable @keyup.enter="fetchPosts" />
        <el-button type="primary" @click="fetchPosts">搜索</el-button>
      </div>

      <el-table :data="postList" v-loading="loading" @row-click="goToDetail">
        <el-table-column prop="title" label="标题">
          <template #default="{ row }">
            <span>{{ row.title }}</span>
            <el-tag v-if="row.status === 'pending'" type="warning" size="small" style="margin-left: 8px">待审核</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="author.username" label="作者" width="120" />
        <el-table-column prop="likeCount" label="点赞" width="80">
          <template #default="{ row }">
            <el-icon><Star /></el-icon> {{ row.likeCount }}
          </template>
        </el-table-column>
        <el-table-column prop="commentCount" label="评论" width="80">
          <template #default="{ row }">
            <el-icon><ChatDotRound /></el-icon> {{ row.commentCount }}
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="浏览" width="80" />
        <el-table-column prop="createdAt" label="发布时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchPosts"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Star, ChatDotRound } from '@element-plus/icons-vue'
import { getPostList } from '@/api/post'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)
const postList = ref([])
const keyword = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const formatTime = (t) => dayjs(t).format('YYYY-MM-DD HH:mm')

const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await getPostList({ keyword: keyword.value, page: page.value, pageSize: pageSize.value })
    postList.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const goToDetail = (row) => {
  router.push(`/forum/${row.id}`)
}

onMounted(fetchPosts)
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-bar { display: flex; gap: 12px; margin-bottom: 20px; }
.el-table { cursor: pointer; }
</style>