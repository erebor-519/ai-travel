<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import OpenAI from 'openai'
import AMapService from '../features/map/amap.service.js'
import regeneratePlanPrompt from '../features/map/regenerate-plan-prompt.md?raw'
import LoginModal from '../components/LoginModal.vue'

window._AMapSecurityConfig = {
  securityJsCode: '49b1e1860ca6fe3ce62911c2ce619345',
}

// 用户登录状态
const isLoggedIn = ref(false)
const userInfo = ref(null)
const showLoginModal = ref(false)

// 检查登录状态
const checkLoginStatus = () => {
  const storedUserInfo = localStorage.getItem('userInfo')
  if (storedUserInfo) {
    userInfo.value = JSON.parse(storedUserInfo)
    isLoggedIn.value = true
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

// 处理登出
const handleLogout = () => {
  localStorage.removeItem('userInfo')
  userInfo.value = null
  isLoggedIn.value = false
}

const route = useRoute()
const travelInput = ref('')
const planResult = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const isRouteLoading = ref(false)
const routeErrorMessage = ref('')
const showMap = ref(true)
const leftPanelCollapsed = ref(false)
let originalBodyStyle = ''
let currentDragRoute = null
let abortController = null
let isCancelled = false  // 全局取消标志

const amapService = AMapService

const client = new OpenAI({
  baseURL: window.location.origin + '/api',
  apiKey: 'b644c04f33fd3a89ed601ec9cdadfddb:MDM3YTllYWVjZTAwMjY4MTM4ZTlhM2Vm',
  defaultHeaders: { 'X-Failover-Enabled': 'true' },
  dangerouslyAllowBrowser: true
})

const analysis_system_prompt = `你是一个专业的旅行规划师，擅长根据用户需求生成详细的旅行计划。请按照以下格式输出：

旅行计划标题

行程概览
总天数：X天
预算范围：XXX
旅行主题：XXX

每日行程

Day 1
上午：[活动内容] - [地点] - [时间]
下午：[活动内容] - [地点] - [时间]
晚上：[活动内容] - [地点] - [时间]

Day 2
...以此类推

注意事项
1. [注意事项1]
2. [注意事项2]
...

请确保计划详细、合理，旅行路线不能重复，一天游玩的地方不宜相距太远，计划符合用户的需求。`

const generateTravelPlan = async () => {
  if (!travelInput.value.trim()) {
    errorMessage.value = '请输入旅行需求'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  planResult.value = ''
  showMap.value = false
  isCancelled = false  // 重置取消标志
  
  // 创建 AbortController 用于取消请求
  abortController = new AbortController()
  
  if (currentDragRoute) {
    try {
      currentDragRoute.hide()
    } catch (error) {
      console.warn('隐藏路径规划失败:', error)
    }
    currentDragRoute = null
  }
  
  if (window.currentMap) {
    try {
      window.currentMap.clearMap()
    } catch (error) {
      console.warn('清除地图失败:', error)
    }
  }

  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          "role": "system",
          "content": analysis_system_prompt
        },
        {
          "role": "user",
          "content": `旅行需求：${travelInput.value}\n\n请生成详细的旅行计划。`
        }
      ],
      model: "astron-code-latest",
      stream: false,
      max_completion_tokens: 2024,
      temperature: 0.6,
      top_p: 0.95,
      frequency_penalty: 0,
      signal: abortController.signal
    })

    const content = response.choices[0].message.content.trim()
    // 暂时不显示原始旅行计划，等待重新生成
    const tempPlan = content
    await generateRoutePlan(tempPlan)
  } catch (error) {
    // 检查是否是用户取消的请求
    if (isCancelled || error.name === 'AbortError' || error.cmessage?.includes('aborted')) {
      console.log('操作已取消')
      return
    }
    console.error('生成旅行计划失败:', error)
    if (error.response) {
      console.error('API响应错误:', error.response.status, error.response.data)
      errorMessage.value = `API响应错误: ${error.response.status}`
    } else if (error.request) {
      console.error('无API响应:', error.request)
      errorMessage.value = '无法连接到API服务器，请检查网络连接'
    } else {
      console.error('请求设置错误:', error.message)
      errorMessage.value = `请求设置错误: ${error.message}`
    }
  } finally {
    isLoading.value = false
  }
}

const generateRoutePlan = async (tempPlan) => {
  // 检查是否已取消
  if (isCancelled) return
  
  const planToUse = tempPlan || planResult.value
  if (!planToUse) {
    routeErrorMessage.value = '请先生成旅行计划'
    return
  }

  isRouteLoading.value = true
  routeErrorMessage.value = ''

  try {
    // 检查是否已取消
    if (isCancelled) return
    
    const places = await amapService.parseTravelPlan(planToUse)
    
    // 检查是否已取消
    if (isCancelled) return

    if (places.length < 2) {
      console.log('提取的地点数量不足:', places.length, '地点:', places);
      routeErrorMessage.value = '无法从旅行计划中提取足够的地点，请确保计划中包含明确的地点信息'
      return
    }

    // 检查是否已取消
    if (isCancelled) return

    // 使用筛选后的地点重新生成旅行计划
    const placeNames = places.map(place => place.name).join('、')
    const regeneratedPlan = await client.chat.completions.create({
      messages: [
        {
          "role": "system",
          "content": regeneratePlanPrompt
        },
        {
          "role": "user",
          "content": `用户原始输入：${travelInput.value}\n\n筛选后的地点：${placeNames}\n\n请优先考虑用户原始输入，根据这些地点重新生成详细的旅行计划。`
        }
      ],
      model: "astron-code-latest",
      stream: false,
      max_completion_tokens: 2024,
      temperature: 0.6,
      top_p: 0.95,
      frequency_penalty: 0,
      signal: abortController.signal
    })
    
    // 检查是否已取消
    if (isCancelled) return

    planResult.value = regeneratedPlan.choices[0].message.content.trim()

    showMap.value = true
    await showRouteOnMap(places)
  } catch (error) {
    // 检查是否是用户取消的请求
    if (isCancelled || error.name === 'AbortError' || error.cmessage?.includes('aborted')) {
      console.log('操作已取消')
      return
    }
    console.error('生成路径规划失败:', error)
    if (error.response) {
      console.error('API响应错误:', error.response.status, error.response.data)
      routeErrorMessage.value = `API响应错误: ${error.response.status}`
    } else if (error.request) {
      console.error('无API响应:', error.request)
      routeErrorMessage.value = '无法连接到API服务器，请检查网络连接'
    } else {
      console.error('请求设置错误:', error.message)
      routeErrorMessage.value = `请求设置错误: ${error.message}`
    }
  } finally {
    if (!isCancelled) {
      isRouteLoading.value = false
    }
  }
}

const showRouteOnMap = async (places) => {
  // 检查是否已取消
  if (isCancelled) return
  
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // 检查是否已取消
  if (isCancelled) return

  const mapContainer = document.getElementById('container')
  if (!mapContainer) {
    return
  }

  await amapService.loadSDK()
  
  // 检查是否已取消
  if (isCancelled) return

  const path = places.map(place => place.location)

  try {
    if (window.currentMap) {
      window.currentMap.destroy()
      window.currentMap = null
    }
  } catch (error) {
    console.warn('销毁旧地图失败:', error)
  }
  
  // 检查是否已取消
  if (isCancelled) return
  
  const map = new window.AMap.Map("container", {
    resizeEnable: true
  })
  window.currentMap = map
  
  // 检查是否已取消
  if (isCancelled) {
    try { map.destroy() } catch (e) {}
    return
  }

  window.AMap.plugin("AMap.DragRoute", function() {
    // 检查是否已取消
    if (isCancelled) return
    
    currentDragRoute = new window.AMap.DragRoute(map, path, window.AMap.DrivingPolicy.LEAST_FEE)
    currentDragRoute.search()
    
    map.setCenter(places[0].location)
    map.setZoom(13)
  })
}

const initMap = async () => {
  await new Promise(resolve => setTimeout(resolve, 200))

  const mapContainer = document.getElementById('container')
  if (!mapContainer) {
    return
  }

  await amapService.loadSDK()

  if (!window.currentMap) {
    const map = new window.AMap.Map("container", {
      resizeEnable: true,
      zoom: 11
    })
    window.currentMap = map
  } else {
    try {
      window.currentMap.getZoom()
    } catch (error) {
      console.warn('旧地图实例不可用，重新创建:', error)
      const map = new window.AMap.Map("container", {
        resizeEnable: true,
        zoom: 11
      })
      window.currentMap = map
    }
  }
}

onMounted(() => {
  originalBodyStyle = document.body.style.cssText
  document.body.style.margin = '0'
  document.body.style.padding = '0'
  document.body.style.overflow = 'hidden'
  document.body.style.height = '100vh'
  document.body.style.width = '100vw'

  // 检查登录状态
  checkLoginStatus()

  if (route.query.input) {
    travelInput.value = decodeURIComponent(route.query.input)
    generateTravelPlan()
  }
  initMap()
})

onBeforeUnmount(() => {
  // 设置取消标志，停止所有操作
  isCancelled = true
  
  // 取消正在进行的 API 请求
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  
  document.body.style.cssText = originalBodyStyle
  
  if (window.currentMap) {
    try {
      window.currentMap.destroy()
    } catch (error) {
      console.warn('销毁地图失败:', error)
    }
    window.currentMap = null
  }
})
</script>

<template>
  <div class="travel-plan-page">
    <!-- 头部导航 -->
    <header class="header">
      <h1>AI 智能旅行助手</h1>
      <nav>
        <ul>
          <li>
            <router-link to="/">首页</router-link>
          </li>
          <li>
            <router-link to="/explore">探索</router-link>
          </li>
          <li>
            <router-link to="/poi-experience">足迹</router-link>
          </li>
          <li>
            <router-link to="/travel-plan">旅行规划</router-link>
          </li>
          <li v-if="!isLoggedIn">
            <a href="#" @click.prevent="openLoginModal">登录</a>
          </li>
          <li v-else class="user-menu">
            <div class="user-info" @click="handleLogout">
              <img :src="userInfo.avatar" alt="avatar" class="user-avatar" />
              <span>{{ userInfo.nickname }}</span>
            </div>
          </li>
        </ul>
      </nav>
    </header>

    <!-- 登录弹窗 -->
    <LoginModal
      :show="showLoginModal"
      @close="closeLoginModal"
      @login="handleLogin"
    />
    
    <!-- 主要内容 -->
    <div class="content-wrapper">
      <div class="left-panel" :class="{ collapsed: leftPanelCollapsed }">
        <button class="collapse-btn" @click="leftPanelCollapsed = !leftPanelCollapsed">
          {{ leftPanelCollapsed ? '→' : '×' }}
        </button>
        <div class="plan-generator" v-show="!leftPanelCollapsed">
          <h2>旅行计划生成器</h2>
          <div class="input-section">
            <input 
              v-model="travelInput"
              type="text" 
              placeholder="例如：北京5日游，喜欢历史文化" 
              class="travel-input"
            />
            <button 
              class="generate-btn" 
              @click="generateTravelPlan"
              :disabled="isLoading"
            >
              {{ isLoading ? '生成中...（预计约1分钟）' : '生成计划' }}
            </button>
          </div>
          
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          
          <div v-if="planResult" class="plan-result">
            <h3>您的旅行计划</h3>
            <div class="plan-content">
              <pre>{{ planResult }}</pre>
            </div>
          </div>
          
          <div v-if="routeErrorMessage" class="error-message">
            {{ routeErrorMessage }}
          </div>
        </div>
      </div>
      <div class="right-panel">
        <div class="map-section">
          <div id="container"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#container {
  width: 100%;
  height: 100%;
}

.travel-plan-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
  background: white;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: var(--text-white);
  padding: var(--spacing-md) var(--spacing-xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-md);
  z-index: 2000;
  flex-shrink: 0;
}

.header h1 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin: 0;
}

.header nav ul {
  display: flex;
  list-style: none;
  gap: var(--spacing-xl);
  margin: 0;
  padding: 0;
}

.header nav a,
.header nav router-link {
  color: var(--text-white);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.header nav a:hover,
.header nav router-link:hover {
  background: rgba(255, 255, 255, 0.1);
  text-decoration: none;
}

.header nav router-link.active {
  background: rgba(255, 255, 255, 0.2);
  font-weight: 600;
}

.user-menu {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.content-wrapper {
  display: flex;
  flex: 1;
  width: 100%;
  position: relative;
  min-height: 0;
}

.left-panel {
  position: absolute;
  top: 10px;
  left: 15px;
  width: 190px;
  max-width: calc(100vw - 30px);
  max-height: calc(100vh - 30px);
  overflow-y: auto;
  padding: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  z-index: 1000;
  transition: width 0.3s ease, padding 0.3s ease;
}

.left-panel.collapsed {
  width: 50px;
  padding: 10px;
  max-height: none;
  overflow: hidden;
}

.left-panel.collapsed .collapse-btn {
  top: 10px;
  right: 10px;
  left: auto;
}

.collapse-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: var(--primary-color);
  color: white;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 101;
  transition: background 0.3s ease;
}

.collapse-btn:hover {
  background: var(--primary-dark);
}

.right-panel {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

@media (min-width: 1024px) {
  .content-wrapper {
    flex-direction: row;
    position: static;
  }

  .left-panel {
    position: static;
    top: auto;
    left: auto;
    width: 450px;
    min-width: 450px;
    min-height: auto;
    max-height: none;
    height: 100%;
    border-bottom: none;
    border-right: 1px solid var(--border-light);
    z-index: auto;
    box-shadow: none;
    border-radius: 0;
    transition: none;
  }

  .left-panel.collapsed {
    width: 450px;
    padding: var(--spacing-lg);
  }

  .collapse-btn {
    display: none;
  }

  .right-panel {
    flex: 1;
    width: auto;
    min-height: auto;
  }
  
  .left-panel {
    top: auto;
    left: auto;
    max-height: none;
  }
  
  .tip {
    top: 80px;
  }
}

.plan-generator {
  background: transparent;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
}

@media (min-width: 1024px) {
  .plan-generator {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    box-shadow: var(--shadow-md);
  }
}

.plan-generator h2 {
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  text-align: center;
  width: 144px;
}

.input-section {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
}

.travel-input {
  flex: 1;
  min-width: 100px;
  padding: var(--spacing-xs);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.generate-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: background 0.3s ease;
}

.generate-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.generate-btn:disabled {
  background: var(--border-light);
  cursor: not-allowed;
}

.error-message {
  color: var(--error-color);
  padding: var(--spacing-xs);
  background: var(--error-bg);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-sm);
}

.plan-result {
  margin-top: var(--spacing-sm);
}

.plan-result h3 {
  margin-bottom: var(--spacing-xs);
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.plan-content {
  background: var(--bg-secondary);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  max-height: 150px;
  overflow-y: auto;
}

@media (min-width: 1024px) {
  .plan-content {
    max-height: 500px;
  }
}

.plan-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  color: var(--text-primary);
  font-size: 0.9rem;
  line-height: 1.6;
}

.route-btn {
  margin-top: var(--spacing-md);
  background: var(--secondary-color);
}

.route-btn:hover:not(:disabled) {
  background: var(--secondary-dark);
}

.map-section {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

#container {
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 隐藏高德地图水印 */
#container :deep(.amap-copyright),
#container :deep(.amap-logo) {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }
  
  .header nav ul {
    gap: var(--spacing-md);
  }
  
  .left-panel {
    top: 10px;
    max-height: calc(100vh - 120px);
  }
}
</style>
