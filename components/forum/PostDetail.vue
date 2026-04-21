<template>
  <div class="post-detail">
    <el-card v-loading="loading">
      <div class="post-header">
        <h2>{{ post.title }}</h2>
        <div class="post-meta">
          <span>作者：{{ post.author?.username }}</span>
          <span>发布于：{{ formatTime(post.createdAt) }}</span>
          <span>浏览：{{ post.viewCount }}</span>
        </div>
      </div>
      
      <div class="post-content" v-html="post.content"></div>
      
      <div class="post-actions">
        <el-button :type="post.isLiked ? 'primary' : 'default'" @click="handleLike">
          <el-icon><Star /></el-icon> 点赞 {{ post.likeCount }}
        </el-button>
        <el-button v-if="post.canEdit" @click="handleEdit">编辑</el-button>
        <el-button v-if="post.canDelete" type="danger" @click="handleDelete">删除</el-button>
      </div>
      
      <el-divider />
      
      <!-- 评论区 -->
      <div class="comment-section">
        <h4>评论 ({{ post.commentCount }})</h4>
        
        <div class="comment-input">
          <el-input v-model="commentContent" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="写下你的评论..." />
          <el-button type="primary" style="margin-top: 12px" @click="handleComment">发表评论</el-button>
        </div>
        
        <div class="comment-list">
          <div v-for="comment in commentList" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <span class="comment-author">{{ comment.author?.username }}</span>
              <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
            </div>
            <div class="comment-content">{{ comment.isDeleted ? '该评论已被删除' : comment.content }}</div>
            <div class="comment-actions" v-if="!comment.isDeleted">
              <el-button text @click="handleReport(comment)">举报</el-button>
              <el-button text type="danger" v-if="canDeleteComment(comment)" @click="handleDeleteComment(comment)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 举报对话框 -->
    <el-dialog v-model="reportDialogVisible" title="举报评论" width="400px">
      <el-form>
        <el-form-item label="举报原因">
          <el-select v-model="reportReason" placeholder="请选择">
            <el-option label="垃圾广告" value="spam" />
            <el-option label="人身攻击" value="abuse" />
            <el-option label="色情低俗" value="porn" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="补充说明">
          <el-input v-model="reportDesc" type="textarea" maxlength="200" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReport">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import { getPostDetail, deletePost, toggleLike } from '@/api/post'
import { getCommentList, createComment, deleteComment, reportComment } from '@/api/comment'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const post = ref({})
const commentList = ref([])
const commentContent = ref('')
const reportDialogVisible = ref(false)
const reportCommentId = ref(null)
const reportReason = ref('')
const reportDesc = ref('')
const userId = ref(parseInt(localStorage.getItem('userId') || '0'))

const formatTime = (t) => dayjs(t).format('YYYY-MM-DD HH:mm')

const fetchPost = async () => {
  loading.value = true
  try {
    post.value = (await getPostDetail(route.params.id)).data
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  try {
    commentList.value = (await getCommentList(route.params.id)).data.list
  } catch (error) {
    console.error('获取评论失败')
  }
}

const handleLike = async () => {
  try {
    const res = await toggleLike(post.value.id)
    post.value.isLiked = res.data.liked
    post.value.likeCount = res.data.likeCount
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleEdit = () => {
  router.push(`/forum/${post.value.id}/edit`)
}

const handleDelete = async () => {
  await ElMessageBox.confirm('确定删除帖子？', '确认', { type: 'warning' })
  try {
    await deletePost(post.value.id)
    ElMessage.success('删除成功')
    router.push('/forum/list')
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  }
}

const handleComment = async () => {
  if (!commentContent.value.trim()) return
  try {
    await createComment(post.value.id, { content: commentContent.value })
    ElMessage.success('评论成功')
    commentContent.value = ''
    fetchComments()
    post.value.commentCount++
  } catch (error) {
    ElMessage.error(error.message || '评论失败')
  }
}

const canDeleteComment = (comment) => {
  return comment.authorId === userId.value || post.value.authorId === userId.value
}

const handleDeleteComment = async (comment) => {
  await ElMessageBox.confirm('确定删除评论？', '确认', { type: 'warning' })
  try {
    await deleteComment(comment.id)
    ElMessage.success('删除成功')
    fetchComments()
    post.value.commentCount--
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const handleReport = (comment) => {
  reportCommentId.value = comment.id
  reportDialogVisible.value = true
}

const submitReport = async () => {
  if (!reportReason.value) {
    ElMessage.warning('请选择举报原因')
    return
  }
  try {
    await reportComment(reportCommentId.value, { reason: reportReason.value, description: reportDesc.value })
    ElMessage.success('举报已提交')
    reportDialogVisible.value = false
    reportReason.value = ''
    reportDesc.value = ''
  } catch (error) {
    ElMessage.error(error.message || '举报失败')
  }
}

onMounted(() => {
  fetchPost()
  fetchComments()
})
</script>

<style scoped>
.post-detail { max-width: 900px; margin: 0 auto; }
.post-header { margin-bottom: 20px; }
.post-meta { display: flex; gap: 20px; color: #999; font-size: 14px; margin-top: 10px; }
.post-content { min-height: 200px; padding: 20px 0; line-height: 1.8; }
.post-actions { display: flex; gap: 12px; margin-top: 20px; }
.comment-section { margin-top: 20px; }
.comment-input { margin-bottom: 24px; }
.comment-item { padding: 16px 0; border-bottom: 1px solid #f0f0f0; }
.comment-header { margin-bottom: 8px; }
.comment-author { font-weight: bold; margin-right: 12px; }
.comment-time { color: #999; font-size: 12px; }
.comment-content { line-height: 1.6; }
.comment-actions { margin-top: 8px; }
</style>