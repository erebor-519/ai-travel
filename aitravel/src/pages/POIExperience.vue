<script setup>
import { ref, onMounted } from 'vue'
import { authService } from '../utils/auth.js'
import { forumService } from '../utils/forum.js'
import LoginModal from '../components/LoginModal.vue'

// 用户登录状态
const isLoggedIn = ref(false)
const userInfo = ref(null)
const showLoginModal = ref(false)

// 帖子相关状态
const posts = ref([])
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
})
const isLoading = ref(true)
const errorMessage = ref('')

// 发帖相关状态
const showCreatePostModal = ref(false)
const newPost = ref({
  title: '',
  content: '',
  tags: [],
  location: '',
  days: 1,
  budget: ''
})
const tagInput = ref('')
const isCreating = ref(false)
const likingPostId = ref(null) // 正在点赞的帖子ID，防止重复点击

// 排序选项
const sortBy = ref('createdAt')
const sortOrder = ref('desc')
const sortOptions = [
  { value: 'createdAt', label: '最新发布' },
  { value: 'likeCount', label: '最多点赞' }
]

// 检查登录状态
const checkLoginStatus = () => {
  if (authService.isLoggedIn()) {
    authService.getCurrentUser().then(result => {
      if (result) {
        userInfo.value = result.data
        isLoggedIn.value = true
      }
    })
  }
}

// 打开登录弹窗
const openLoginModal = () => {
  showLoginModal.value = true
}

// 关闭登录弹窗
const closeLoginModal = () => {
  showLoginModal.value = false
}

// 处理登录成功
const handleLogin = (user) => {
  userInfo.value = user
  isLoggedIn.value = true
}



// 加载帖子
const loadPosts = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await forumService.getPosts(
      pagination.value.page,
      pagination.value.limit,
      sortBy.value,
      sortOrder.value
    )

    if (result.success) {
      posts.value = result.data.posts
      pagination.value = result.data.pagination
    } else {
      errorMessage.value = result.message || '加载帖子失败'
    }
  } catch (error) {
    console.error('加载帖子失败:', error)
    errorMessage.value = '加载帖子失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

// 切换页码
const changePage = (page) => {
  if (page < 1 || page > pagination.value.totalPages) return
  pagination.value.page = page
  loadPosts()
}

// 切换排序
const changeSort = (option) => {
  sortBy.value = option.value
  sortOrder.value = option.value === 'createdAt' ? 'desc' : 'desc'
  pagination.value.page = 1
  loadPosts()
}

// 点赞/取消点赞处理
const handleLike = async (post) => {
  if (!isLoggedIn.value) {
    openLoginModal()
    return
  }

  // 防止重复点击
  if (likingPostId.value === post._id) return
  likingPostId.value = post._id

  try {
    const result = await forumService.toggleLike(post._id)
    if (result.success) {
      // 更新本地帖子数据
      const index = posts.value.findIndex(p => p._id === post._id)
      if (index !== -1) {
        posts.value[index].likes = result.data.liked 
          ? [...(posts.value[index].likes || []), userInfo.value.userId]
          : (posts.value[index].likes || []).filter(id => id !== userInfo.value.userId)
        posts.value[index].likeCount = result.data.likeCount
      }
    } else {
      alert(result.message || '操作失败')
    }
  } catch (error) {
    console.error('点赞失败:', error)
    alert('操作失败，请稍后重试')
  } finally {
    // 释放锁定
    likingPostId.value = null
  }
}

// 检查是否已点赞
const isPostLiked = (post) => {
  if (!post || !post.likes || !userInfo.value) return false
  return post.likes.includes(userInfo.value.userId)
}

// 打开发帖弹窗
const openCreatePostModal = () => {
  if (!isLoggedIn.value) {
    openLoginModal()
    return
  }
  
  newPost.value = {
    title: '',
    content: '',
    tags: [],
    location: '',
    days: 1,
    budget: ''
  }
  tagInput.value = ''
  showCreatePostModal.value = true
}

// 关闭发帖弹窗
const closeCreatePostModal = () => {
  showCreatePostModal.value = false
}

// 添加标签
const addTag = () => {
  if (tagInput.value.trim() && !newPost.value.tags.includes(tagInput.value.trim())) {
    newPost.value.tags.push(tagInput.value.trim())
    tagInput.value = ''
  }
}

// 移除标签
const removeTag = (index) => {
  newPost.value.tags.splice(index, 1)
}

// 提交帖子
const submitPost = async () => {
  if (!newPost.value.title.trim()) {
    alert('请输入帖子标题')
    return
  }
  
  if (!newPost.value.content.trim()) {
    alert('请输入帖子内容')
    return
  }

  isCreating.value = true
  try {
    const result = await forumService.createPost(newPost.value)
    if (result.success) {
      alert('发布成功！')
      closeCreatePostModal()
      loadPosts()
    } else {
      alert(result.message || '发布失败')
    }
  } catch (error) {
    console.error('发布失败:', error)
    alert('发布失败，请稍后重试')
  } finally {
    isCreating.value = false
  }
}

// 删除帖子
const handleDeletePost = async (post) => {
  if (!confirm('确定要删除这篇帖子吗？')) return
  
  const result = await forumService.deletePost(post._id)
  if (result.success) {
    alert('删除成功')
    loadPosts()
  } else {
    alert(result.message || '删除失败')
  }
}

// 格式化时间
const formatTime = (timeString) => {
  const date = new Date(timeString)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 30) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 初始化
onMounted(() => {
  checkLoginStatus()
  loadPosts()
})
</script>

<template>
  <div class="forum-page">
    <!-- 登录弹窗 -->
    <LoginModal
      :show="showLoginModal"
      @close="closeLoginModal"
      @login="handleLogin"
    />

    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="sort-options">
          <select v-model="sortBy" @change="changeSort({ value: sortBy, label: sortOptions.find(o => o.value === sortBy)?.label })">
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <button class="create-post-btn" @click="openCreatePostModal">
          ✏️ 发布旅行规划
        </button>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
        <button @click="loadPosts" class="retry-btn">重试</button>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载帖子...</p>
      </div>

      <!-- 帖子列表 -->
      <div v-else class="posts-list">
        <!-- 无帖子提示 -->
        <div v-if="posts.length === 0" class="no-posts">
          <p>还没有帖子，快来分享你的旅行规划吧！</p>
        </div>

        <!-- 帖子卡片 -->
        <div v-for="post in posts" :key="post._id" class="post-card">
          <!-- 用户信息 -->
          <div class="post-header">
            <div class="user-info">
              <img v-if="post.userInfo && post.userInfo.avatar" :src="post.userInfo.avatar" :alt="post.userInfo.nickname || '用户'" class="user-avatar" />
              <div v-else class="default-avatar">{{ (post.userInfo && post.userInfo.nickname) ? post.userInfo.nickname.charAt(0) : '?' }}</div>
              <div class="user-details">
                <h3 class="user-name">{{ post.userInfo ? post.userInfo.nickname : '匿名用户' }}</h3>
                <span class="post-time">{{ formatTime(post.createdAt) }}</span>
              </div>
            </div>
            <div class="post-meta">
              <span class="post-location" v-if="post.location">📍 {{ post.location }}</span>
              <span class="post-days" v-if="post.days">⏱️ {{ post.days }}天</span>
              <span class="post-budget" v-if="post.budget">💰 {{ post.budget }}</span>
            </div>
          </div>

          <!-- 帖子内容 -->
          <div class="post-content">
            <h2 class="post-title">{{ post.title }}</h2>
            <div class="post-body">
              <pre>{{ post.content }}</pre>
            </div>
            
            <!-- 标签 -->
            <div class="post-tags" v-if="post.tags && post.tags.length > 0">
              <span v-for="tag in post.tags" :key="tag" class="tag">
                #{{ tag }}
              </span>
            </div>
          </div>

          <!-- 操作栏 -->
          <div class="post-actions">
            <button 
              class="like-btn" 
              :class="{ liked: isPostLiked(post) }"
              @click="handleLike(post)"
            >
              <span class="like-icon">{{ isPostLiked(post) ? '❤️' : '🤍' }}</span>
              <span class="like-count">{{ post.likeCount || 0 }}</span>
            </button>
            
            <!-- 删除按钮（仅帖子作者可见） -->
            <button 
              v-if="isLoggedIn && userInfo && post.userId === userInfo.userId"
              class="delete-btn"
              @click="handleDeletePost(post)"
            >
              🗑️ 删除
            </button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button 
          class="page-btn" 
          :disabled="pagination.page === 1"
          @click="changePage(pagination.page - 1)"
        >
          上一页
        </button>
        
        <div class="page-numbers">
          <span class="page-info">
            第 {{ pagination.page }} 页 / 共 {{ pagination.totalPages }} 页
          </span>
        </div>
        
        <button 
          class="page-btn" 
          :disabled="pagination.page === pagination.totalPages"
          @click="changePage(pagination.page + 1)"
        >
          下一页
        </button>
      </div>
    </main>

    <!-- 发帖弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCreatePostModal" class="modal-overlay" @click.self="closeCreatePostModal">
          <div class="modal-content">
            <div class="modal-header">
              <h2>发布旅行规划</h2>
              <button class="close-btn" @click="closeCreatePostModal">×</button>
            </div>
            
            <div class="modal-body">
              <!-- 标题 -->
              <div class="form-group">
                <label for="title">标题 *</label>
                <input
                  id="title"
                  v-model="newPost.title"
                  type="text"
                  placeholder="请输入帖子标题"
                  maxlength="100"
                />
              </div>

              <!-- 内容 -->
              <div class="form-group">
                <label for="content">旅行规划内容 *</label>
                <textarea
                  id="content"
                  v-model="newPost.content"
                  placeholder="请详细描述你的旅行规划，包括行程安排、预算、注意事项等"
                  rows="6"
                ></textarea>
              </div>

              <!-- 地点 -->
              <div class="form-group">
                <label for="location">旅行地点</label>
                <input
                  id="location"
                  v-model="newPost.location"
                  type="text"
                  placeholder="例如：北京、上海、云南"
                />
              </div>

              <!-- 天数 -->
              <div class="form-group">
                <label for="days">旅行天数</label>
                <select id="days" v-model="newPost.days">
                  <option value="1">1天</option>
                  <option value="2">2天</option>
                  <option value="3">3天</option>
                  <option value="4">4天</option>
                  <option value="5">5天</option>
                  <option value="6">6天</option>
                  <option value="7">7天</option>
                  <option value="8">8天以上</option>
                </select>
              </div>

              <!-- 预算 -->
              <div class="form-group">
                <label for="budget">预算范围</label>
                <input
                  id="budget"
                  v-model="newPost.budget"
                  type="text"
                  placeholder="例如：1000-2000元"
                />
              </div>

              <!-- 标签 -->
              <div class="form-group">
                <label>标签（最多5个）</label>
                <div class="tags-input">
                  <input
                    v-model="tagInput"
                    type="text"
                    placeholder="输入标签后按回车添加"
                    @keyup.enter="addTag"
                  />
                  <button class="add-tag-btn" @click="addTag">添加</button>
                </div>
                <div class="tags-list">
                  <span v-for="(tag, index) in newPost.tags" :key="tag" class="tag">
                    #{{ tag }}
                    <button class="remove-tag" @click="removeTag(index)">×</button>
                  </span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="modal-actions">
                <button class="cancel-btn" @click="closeCreatePostModal">
                  取消
                </button>
                <button 
                  class="submit-btn" 
                  @click="submitPost"
                  :disabled="isCreating || !newPost.title.trim() || !newPost.content.trim()"
                >
                  {{ isCreating ? '发布中...' : '发布' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.forum-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 主要内容 */
.main-content {
  flex: 1;
  padding: var(--spacing-xl);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.sort-options select {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.sort-options select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.create-post-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-post-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 错误提示 */
.error-message {
  background: rgba(231, 76, 60, 0.1);
  color: var(--error-color);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.retry-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--error-color);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background 0.3s ease;
}

.retry-btn:hover {
  background: #c0392b;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: var(--spacing-lg);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--border-light);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 无帖子提示 */
.no-posts {
  text-align: center;
  padding: var(--spacing-2xl);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.no-posts p {
  color: var(--text-light);
  font-size: var(--font-size-lg);
}

/* 帖子列表 */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 帖子卡片 */
.post-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 帖子头部 */
.post-header {
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-avatar,
.default-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.default-avatar {
  background: var(--primary-color);
  color: var(--text-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--font-size-base);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.user-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.post-time {
  font-size: var(--font-size-sm);
  color: var(--text-light);
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  align-items: center;
}

.post-location,
.post-days,
.post-budget {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 帖子内容 */
.post-content {
  padding: var(--spacing-lg);
}

.post-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
  line-height: 1.3;
}

.post-body {
  margin-bottom: var(--spacing-md);
}

.post-body pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.6;
  margin: 0;
  font-family: inherit;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tag {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-secondary);
  color: var(--text-light);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}

/* 帖子操作栏 */
.post-actions {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: transparent;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  color: var(--text-light);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.3s ease;
}

.like-btn:hover {
  background: rgba(231, 76, 60, 0.1);
  border-color: var(--error-color);
  color: var(--error-color);
}

.like-btn.liked {
  background: rgba(231, 76, 60, 0.1);
  border-color: var(--error-color);
  color: var(--error-color);
}

.like-icon {
  font-size: var(--font-size-base);
}

.like-count {
  font-weight: 500;
}

.delete-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid var(--error-color);
  border-radius: var(--radius-md);
  color: var(--error-color);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: var(--error-color);
  color: white;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.page-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.page-btn:disabled {
  background: var(--border-light);
  cursor: not-allowed;
  opacity: 0.6;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-info {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

/* 发帖弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: var(--spacing-md);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  z-index: 1;
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-xl);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-light);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--text-primary);
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

/* 标签输入 */
.tags-input {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.tags-input input {
  flex: 1;
}

.add-tag-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-tag-btn:hover {
  background: var(--bg-tertiary);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tags-list .tag {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.remove-tag {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.remove-tag:hover {
  background: var(--border-light);
  color: var(--text-primary);
}

/* 弹窗操作按钮 */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

.cancel-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: var(--bg-tertiary);
}

.submit-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .modal-content,
.fade-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.fade-enter-from .modal-content,
.fade-leave-to .modal-content {
  transform: scale(0.95);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: var(--spacing-md);
  }

  .action-bar {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }

  .create-post-btn {
    width: 100%;
  }

  .post-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .post-meta {
    width: 100%;
  }

  .pagination {
    flex-direction: column;
    gap: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .modal-content {
    margin: var(--spacing-sm);
  }

  .modal-body {
    padding: var(--spacing-md);
  }
}
</style>