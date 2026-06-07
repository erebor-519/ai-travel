<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { forumService } from '../utils/forum.js'
import { cloudbase } from '../utils/cloudbase.js'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()

// 处理 URL 参数自动搜索
onMounted(() => {
  const searchParam = route.query.q
  if (searchParam) {
    searchQuery.value = decodeURIComponent(searchParam)
    handleSearch()
  }
})

// AI 辅助函数：通过CloudBase云函数调用
const callAI = async (messages, options = {}) => {
  const result = await cloudbase.callFunction({
    name: 'ai-proxy',
    data: {
      action: 'chat',
      messages,
      model: options.model || 'astron-code-latest',
      temperature: options.temperature || 0.7,
      max_tokens: options.max_completion_tokens || 800,
      stream: false
    }
  })
  if (!result || result.code !== 200) {
    throw new Error(result?.message || 'AI服务调用失败')
  }
  return result.data
}

// AI 对话系统提示
const ai_system_prompt = `你是一个热情专业的旅行规划师。请为用户介绍目的地，包括：位置与特色、必游景点、最佳游览季节、推荐美食、交通方式。200字左右，内容精炼有趣。`

const popularDestinations = [
  {
    id: 1,
    name: '故宫博物院',
    location: '北京',
    description: '中国明清两代的皇家宫殿，世界上现存规模最大、保存最为完整的木质结构古建筑之一。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Forbidden%20City%20Beijing%20China%20ancient%20palace%20architecture%20cultural%20heritage&image_size=landscape_16_9',
    rating: 4.9
  },
  {
    id: 2,
    name: '外滩',
    location: '上海',
    description: '上海的标志性景观，拥有52栋风格各异的古典复兴大楼，是中国近现代重要史迹及代表性建筑。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Shanghai%20Bund%20skyline%20modern%20city%20buildings%20night%20view&image_size=landscape_16_9',
    rating: 4.8
  },
  {
    id: 3,
    name: '锦里古街',
    location: '成都',
    description: '成都最古老、最热闹的商业街之一，充满了三国文化和四川民俗。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chengdu%20Jinli%20ancient%20street%20traditional%20Chinese%20architecture%20food%20market&image_size=landscape_16_9',
    rating: 4.7
  },
  {
    id: 4,
    name: '西湖',
    location: '杭州',
    description: '中国首批国家重点风景名胜区和中国十大风景名胜之一，被誉为"人间天堂"。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Hangzhou%20West%20Lake%20scenic%20view%20traditional%20Chinese%20garden%20landscape&image_size=landscape_16_9',
    rating: 4.9
  }
]

const searchQuery = ref('')
const isSearching = ref(false)
const aiReply = ref('')
const searchResults = ref([])
const relatedPosts = ref([])
const searchError = ref('')

// 目的地详情弹窗
const showDestinationModal = ref(false)
const currentDestination = ref(null)
const destinationIntro = ref('')
const isLoadingIntro = ref(false)

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    alert('请输入搜索内容')
    return
  }
  
  isSearching.value = true
  aiReply.value = ''
  searchResults.value = []
  relatedPosts.value = []
  searchError.value = ''
  
  try {
    // 1. 调用 AI 获取目的地介绍
    const aiResponse = await callAI([
      { role: 'system', content: ai_system_prompt },
      { role: 'user', content: `请介绍一下「${searchQuery.value}」` }
    ], { max_completion_tokens: 800, temperature: 0.7 })
    aiReply.value = aiResponse.choices[0].message.content.trim()
    
    // 2. 搜索相关帖子
    const result = await forumService.searchPosts(searchQuery.value, 1, 10)
    if (result.success) {
      relatedPosts.value = result.data.posts || []
    }
    
    // 3. 筛选匹配的景点卡片
    const query = searchQuery.value.toLowerCase()
    searchResults.value = popularDestinations.filter(dest => 
      dest.name.toLowerCase().includes(query) ||
      dest.location.toLowerCase().includes(query) ||
      dest.description.toLowerCase().includes(query)
    )
    
  } catch (error) {
    console.error('搜索失败:', error)
    searchError.value = '搜索失败，请稍后重试'
  } finally {
    isSearching.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  aiReply.value = ''
  searchResults.value = []
  relatedPosts.value = []
}

const goToPost = (post) => {
  // 跳转到足迹页面并带上搜索关键词
  const keyword = encodeURIComponent(searchQuery.value || post.title || '')
  router.push(`/poi-experience?search=${keyword}`)
}

// 查看目的地详情
const viewDestination = async (destination) => {
  currentDestination.value = destination
  showDestinationModal.value = true
  isLoadingIntro.value = true
  destinationIntro.value = ''
  
  try {
    const response = await callAI([
      { role: 'system', content: ai_system_prompt },
      { role: 'user', content: `请介绍一下「${destination.name}」（位于${destination.location}）` }
    ], { max_completion_tokens: 800, temperature: 0.7 })
    destinationIntro.value = response.choices[0].message.content.trim()
  } catch (error) {
    console.error('生成介绍失败:', error)
    destinationIntro.value = null
  } finally {
    isLoadingIntro.value = false
  }
}

const closeDestinationModal = () => {
  showDestinationModal.value = false
  currentDestination.value = null
  destinationIntro.value = ''
}
</script>

<template>
  <div class="explore-page">
    <div class="explore-header">
      <h1>{{ t('explore.title') }}</h1>
      <div class="search-bar">
        <div class="search-input-wrapper">
          <input 
            type="text" 
            v-model="searchQuery" 
            :placeholder="t('explore.searchPlaceholder')" 
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clearSearch">×</button>
        </div>
        <button class="search-btn" @click="handleSearch" :disabled="isSearching">
          {{ isSearching ? t('explore.searching') : t('explore.searchBtn') }}
        </button>
      </div>
    </div>

    <!-- AI 搜索结果区域 -->
    <div v-if="isSearching" class="ai-loading">
      <div class="loading-spinner"></div>
      <span>{{ t('explore.aiLoading') }}</span>
    </div>

    <div v-if="searchError" class="error-message">
      {{ t('explore.searchError') }}
    </div>

    <!-- AI 介绍 -->
    <div v-if="aiReply" class="ai-result">
      <div class="ai-result-header">
        <span class="ai-badge">🤖 {{ t('explore.aiAssistant') }}</span>
        <span>{{ t('explore.about') }}「{{ searchQuery }}」</span>
      </div>
      
      <div class="ai-reply">
        {{ aiReply }}
      </div>
    </div>

    <!-- 搜索结果统计 -->
    <div v-if="searchResults.length > 0 || relatedPosts.length > 0" class="search-summary">
      <span v-if="searchResults.length > 0">{{ t('explore.foundDestinations', { count: searchResults.length }) }}</span>
      <span v-if="relatedPosts.length > 0">{{ t('explore.foundPosts', { count: relatedPosts.length }) }}</span>
    </div>

    <!-- 相关帖子列表 -->
    <div v-if="relatedPosts.length > 0" class="related-posts-section">
      <h2>📝 {{ t('explore.relatedPosts') }}</h2>
      <div class="posts-list">
        <div v-for="post in relatedPosts" :key="post._id" class="post-card" @click="goToPost(post)">
          <div class="post-header">
            <div class="user-avatar-small">
              {{ (post.userInfo?.nickname || t('explore.anonymous'))[0] }}
            </div>
            <span class="post-author">{{ post.userInfo?.nickname || t('explore.anonymous') + '用户' }}</span>
            <span class="post-time">{{ new Date(post.createdAt).toLocaleDateString() }}</span>
          </div>
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-content">{{ post.content?.substring(0, 100) }}{{ post.content?.length > 100 ? '...' : '' }}</p>
          <div class="post-tags" v-if="post.tags?.length">
            <span v-for="tag in post.tags.slice(0, 3)" :key="tag" class="tag">#{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 目的地卡片 -->
    <div class="destinations-section">
      <h2 v-if="searchResults.length > 0">🎯 {{ t('explore.matchingDestinations') }}</h2>
      <h2 v-else>🌟 {{ t('explore.popularDestinations') }}</h2>
      
      <div class="destinations-grid">
        <div 
          v-for="destination in (searchResults.length > 0 ? searchResults : popularDestinations)" 
          :key="destination.id"
          class="destination-card"
        >
          <div class="destination-image">
            <img :src="destination.image" :alt="destination.name" />
            <div class="destination-rating">
              <span class="rating-star">⭐</span>
              <span>{{ destination.rating }}</span>
            </div>
          </div>
          <div class="destination-content">
            <div class="destination-location">
              <span class="location-icon">📍</span>
              <span>{{ destination.location }}</span>
            </div>
            <h3>{{ destination.name }}</h3>
            <p>{{ destination.description }}</p>
            <button class="explore-btn" @click="viewDestination(destination)">{{ t('explore.learnMore') }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 目的地详情弹窗 -->
    <div v-if="showDestinationModal" class="modal-overlay" @click.self="closeDestinationModal">
      <div class="destination-modal">
        <div class="modal-header">
          <h2>{{ currentDestination?.name }}</h2>
          <button class="modal-close" @click="closeDestinationModal">×</button>
        </div>
        <div class="modal-body">
          <div class="modal-destination-info">
            <span class="location-icon">📍</span>
            <span>{{ currentDestination?.location }}</span>
            <span class="rating-star">⭐</span>
            <span>{{ currentDestination?.rating }}</span>
          </div>
          
          <div v-if="isLoadingIntro" class="intro-loading">
            <div class="loading-spinner"></div>
            <span>{{ t('explore.introLoading') }}</span>
          </div>
          
          <div v-else-if="destinationIntro" class="destination-intro">
            <div class="ai-badge">🤖 {{ t('explore.aiAssistant') }}</div>
            <p>{{ destinationIntro }}</p>
          </div>
          
          <div v-else class="intro-error">
            {{ t('explore.introError') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.explore-page {
  padding: var(--spacing-lg);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.explore-header {
  margin-bottom: var(--spacing-2xl);
  text-align: center;
}

.explore-header h1 {
  font-size: var(--font-size-3xl);
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
}

.search-bar {
  display: flex;
  max-width: 600px;
  margin: 0 auto;
  gap: var(--spacing-sm);
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: var(--spacing-md);
  padding-right: 36px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.search-btn {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--primary-color);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.search-btn:disabled {
  background: var(--border-light);
  cursor: not-allowed;
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--text-light);
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  padding: 0;
}

.clear-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* AI 结果样式 */
.ai-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border-light);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  padding: var(--spacing-md);
  background: rgba(231, 76, 60, 0.1);
  color: var(--error-color);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.ai-result {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border: 2px solid var(--primary-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.ai-result-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.ai-badge {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.ai-reply {
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  line-height: 1.8;
  white-space: pre-wrap;
  border: 1px solid var(--border-light);
}

.search-summary {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-sm);
}

/* 相关帖子 */
.related-posts-section {
  margin-bottom: var(--spacing-2xl);
}

.related-posts-section h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-xl);
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.post-card {
  background: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-light);
}

.post-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.user-avatar-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.post-author {
  font-weight: 500;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.post-time {
  color: var(--text-light);
  font-size: var(--font-size-xs);
}

.post-title {
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-base);
}

.post-content {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  margin-bottom: var(--spacing-sm);
}

.post-tags {
  display: flex;
  gap: var(--spacing-sm);
}

.tag {
  padding: 2px 8px;
  background: var(--bg-secondary);
  color: var(--text-light);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
}

/* 目的地卡片 */
.destinations-section {
  margin-top: var(--spacing-lg);
}

.destinations-section h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-xl);
}

.destinations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-xl);
}

.destination-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.destination-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
}

.destination-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.destination-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.destination-card:hover .destination-image img {
  transform: scale(1.05);
}

.destination-rating {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: rgba(0, 0, 0, 0.7);
  color: var(--text-white);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.rating-star {
  font-size: 1rem;
}

.destination-content {
  padding: var(--spacing-lg);
}

.destination-location {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-light);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-sm);
}

.location-icon {
  font-size: 1rem;
}

.destination-content h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-lg);
}

.destination-content p {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  line-height: 1.5;
}

.explore-btn {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.explore-btn:hover {
  background: var(--primary-color);
  color: var(--text-white);
}

/* 目的地详情弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.destination-modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-xl);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-light);
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--spacing-lg);
  overflow-y: auto;
  max-height: calc(80vh - 70px);
}

.modal-destination-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px dashed var(--border-light);
}

.intro-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  color: var(--text-secondary);
}

.destination-intro {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.destination-intro .ai-badge {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
  display: inline-block;
  margin-bottom: var(--spacing-md);
}

.destination-intro p {
  color: var(--text-primary);
  line-height: 1.8;
  white-space: pre-wrap;
  margin: 0;
}

.intro-error {
  text-align: center;
  color: var(--text-light);
  padding: var(--spacing-xl);
}

@media (max-width: 768px) {
  .destinations-grid,
  .posts-list {
    grid-template-columns: 1fr;
  }
  
  .search-bar {
    flex-direction: column;
  }
  
  .search-btn {
    width: 100%;
  }
}
</style>
