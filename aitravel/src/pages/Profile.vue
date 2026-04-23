<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../utils/auth.js'
import { travelPlanService } from '../utils/travelPlan.js'

const router = useRouter()

const userPlans = ref([])
const isLoadingPlans = ref(false)
const expandedPlans = ref(new Set())  // 存储展开的规划ID

// 切换展开/折叠
const toggleExpand = (plan, event) => {
  event.stopPropagation()
  const planId = plan._id || plan.id
  if (expandedPlans.value.has(planId)) {
    expandedPlans.value.delete(planId)
  } else {
    expandedPlans.value.add(planId)
  }
}

// 检查规划是否展开
const isExpanded = (plan) => {
  const planId = plan._id || plan.id
  return expandedPlans.value.has(planId)
}

// 处理登出
const handleLogout = () => {
  authService.logout()
  localStorage.removeItem('userInfo')
  localStorage.removeItem('userId')
  router.push('/')
}

// 返回旅行规划页面
const goToTravelPlan = () => {
  router.push('/travel-plan')
}

// 复现旅行规划
const restorePlan = (plan) => {
  console.log('点击的规划数据:', plan)
  const planData = {
    content: plan.content,
    places: plan.places || []
  }
  console.log('准备传递的规划数据:', planData)
  const encodedData = encodeURIComponent(JSON.stringify(planData))
  router.push(`/travel-plan?plan=${encodedData}`)
}

// 删除规划
const deletePlan = async (plan, event) => {
  event.stopPropagation()
  
  if (!confirm('确定要删除这个规划吗？')) {
    return
  }
  
  try {
    const result = await travelPlanService.deletePlan(plan.id)
    if (result.success) {
      userPlans.value = userPlans.value.filter(p => p.id !== plan.id)
    } else {
      alert(result.message || '删除失败')
    }
  } catch (error) {
    console.error('删除规划失败:', error)
    alert('删除失败，请稍后重试')
  }
}

// 格式化时间
const formatTime = (timeString) => {
  if (!timeString) return ''
  const date = new Date(timeString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 获取用户信息
const getUserInfo = () => {
  const storedUserInfo = localStorage.getItem('userInfo')
  if (storedUserInfo) {
    return JSON.parse(storedUserInfo)
  }
  return null
}

const userInfo = getUserInfo()

// 加载用户旅行规划
const loadUserPlans = async () => {
  isLoadingPlans.value = true
  try {
    const result = await travelPlanService.getMyPlans()
    if (result.success) {
      console.log('从数据库加载的规划:', result.data.plans)
      userPlans.value = result.data.plans || []
    }
  } catch (error) {
    console.error('加载旅行规划失败:', error)
  } finally {
    isLoadingPlans.value = false
  }
}

onMounted(() => {
  // 如果未登录，重定向到首页
  if (!localStorage.getItem('userId')) {
    router.push('/')
    return
  }
  
  loadUserPlans()
})
</script>

<template>
  <div class="profile-page">
    <!-- 导航栏 -->
    <div class="profile-nav">
      <div class="nav-left">
        <span class="nav-back" @click="router.push('/')">← 返回首页</span>
      </div>
      <div class="nav-right">
        <span class="logout-btn" @click="handleLogout">退出登录</span>
      </div>
    </div>

    <!-- 用户信息卡片 -->
    <div class="profile-header">
      <div class="profile-avatar">
        <img v-if="userInfo && userInfo.avatar" :src="userInfo.avatar" alt="avatar" />
        <div v-else class="default-avatar">{{ userInfo ? userInfo.nickname?.charAt(0) : '?' }}</div>
      </div>
      <div class="profile-info">
        <h1 class="profile-name">{{ userInfo ? userInfo.nickname : '用户' }}</h1>
        <p class="profile-username">@{{ userInfo ? userInfo.username : '' }}</p>
        <p class="profile-email" v-if="userInfo && userInfo.email">{{ userInfo.email }}</p>
      </div>
    </div>

    <!-- 用户操作 -->
    <div class="profile-actions">
      <button class="action-btn primary" @click="goToTravelPlan">
        ✈️开始旅行规划
      </button>
    </div>

    <!-- 历史旅行规划 -->
    <div class="profile-section">
      <h2 class="section-title">📋 我的旅行规划</h2>
      
      <div v-if="isLoadingPlans" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="userPlans.length === 0" class="empty-state">
        <p>还没有保存过旅行规划</p>
        <button class="action-btn" @click="goToTravelPlan">去创建一个</button>
      </div>
      
      <div v-else class="plans-list">
        <div 
          v-for="plan in userPlans" 
          :key="plan.id || plan._id" 
          class="plan-card"
          :class="{ expanded: isExpanded(plan) }"
        >
          <div class="plan-card-content" @click="restorePlan(plan)">
            <div class="plan-header">
              <h3 class="plan-title">{{ plan.title }}</h3>
              <div class="plan-actions">
                <span class="plan-date">{{ formatTime(plan.createdAt) }}</span>
              </div>
            </div>
            <div class="plan-content">
              <pre v-if="isExpanded(plan)">{{ plan.content }}</pre>
              <pre v-else>{{ plan.content?.substring(0, 150) }}{{ plan.content?.length > 150 ? '...' : '' }}</pre>
            </div>
            <div class="plan-footer">
              <div class="plan-meta">
                <span class="plan-places" v-if="plan.places && plan.places.length > 0">
                  📍 {{ plan.places.length }} 个地点
                </span>
                <span class="plan-location" v-if="plan.location">
                  🗺️ {{ plan.location }}
                </span>
              </div>
              <div class="plan-buttons">
                <button 
                  class="expand-btn" 
                  @click="toggleExpand(plan, $event)"
                  :title="isExpanded(plan) ? '收起' : '展开'"
                >
                  {{ isExpanded(plan) ? '▲ 收起' : '▼ 展开' }}
                </button>
                <button class="delete-btn" @click="deletePlan(plan, $event)" title="删除">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.profile-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
}

.nav-left {
  display: flex;
  align-items: center;
}

.nav-back {
  color: var(--primary-color);
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.3s ease;
}

.nav-back:hover {
  opacity: 0.8;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.logout-btn {
  color: var(--error-color);
  cursor: pointer;
  font-weight: 500;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: background 0.3s ease;
}

.logout-btn:hover {
  background: rgba(231, 76, 60, 0.1);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--spacing-xl);
}

.profile-avatar img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--primary-color);
}

.default-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.profile-username {
  color: var(--text-light);
  font-size: var(--font-size-base);
  margin: 0 0 var(--spacing-xs) 0;
}

.profile-email {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.profile-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.action-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: var(--bg-tertiary);
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  border: none;
}

.action-btn.primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.profile-section {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-xl);
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-lg) 0;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-light);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-light);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.plan-card {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  transition: all 0.3s ease;
  cursor: pointer;
}

.plan-card {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.plan-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

.plan-card.expanded {
  border-color: var(--primary-color);
}

.plan-card-content {
  padding: var(--spacing-lg);
  cursor: pointer;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.plan-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.plan-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.plan-date {
  color: var(--text-light);
  font-size: var(--font-size-sm);
}

.plan-content {
  margin-bottom: var(--spacing-md);
}

.plan-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  margin: 0;
  font-family: inherit;
  max-height: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan-card.expanded .plan-content pre {
  max-height: none;
  overflow: visible;
}

.plan-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-light);
}

.plan-meta {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.plan-buttons {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.expand-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.3s ease;
}

.expand-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--primary-color);
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.delete-btn:hover {
  opacity: 1;
}

.plan-places {
  color: var(--primary-color);
  font-size: var(--font-size-sm);
}

.plan-location {
  color: var(--text-light);
  font-size: var(--font-size-sm);
}

@media (max-width: 768px) {
  .profile-page {
    padding: var(--spacing-md);
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>
