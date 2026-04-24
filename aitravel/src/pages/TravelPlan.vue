<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AMapService from '../features/map/amap.service.js'
import generateFinalPlanPrompt from '../features/map/generate-final-plan-prompt.md?raw'
import LoginModal from '../components/LoginModal.vue'
import { travelPlanService } from '../utils/travelPlan.js'
import { cloudbase } from '../utils/cloudbase.js'

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

// 跳转到个人主页
const goToProfile = () => {
  router.push('/profile')
}

// 处理登出
const handleLogout = () => {
  localStorage.removeItem('userInfo')
  userInfo.value = null
  isLoggedIn.value = false
}

const route = useRoute()
const router = useRouter()
const travelInput = ref('')
const planResult = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const isRouteLoading = ref(false)
const routeErrorMessage = ref('')
const showMap = ref(true)
const leftPanelCollapsed = ref(false)
const savedPlaces = ref([])  // 保存拖动后的地点
const isSaving = ref(false)
const saveMessage = ref('')
let originalBodyStyle = ''
let currentDragRoute = null
let abortController = null
let isCancelled = false  // 全局取消标志

const amapService = AMapService

// 保存旅行规划
const openAmapNavigation = () => {
  if (!savedPlaces.value || savedPlaces.value.length < 2) {
    alert('请先生成旅行计划并确保有至少2个地点')
    return
  }
  
  const places = savedPlaces.value
  
  // 使用高德地图网页版的路径规划方式，支持更多途经点
  let url = 'https://ditu.amap.com/dir?'
  
  // 添加起点
  const start = places[0]
  url += `from[name]=${encodeURIComponent(start.name)}&from[lnglat]=${start.location[0]},${start.location[1]}`
  
  // 添加终点
  const end = places[places.length - 1]
  url += `&to[name]=${encodeURIComponent(end.name)}&to[lnglat]=${end.location[0]},${end.location[1]}`
  
  // 添加所有途经点（除了起点和终点）
  if (places.length > 2) {
    const waypoints = places.slice(1, places.length - 1)
    waypoints.forEach((p, index) => {
      url += `&via[${index}][name]=${encodeURIComponent(p.name)}&via[${index}][lnglat]=${p.location[0]},${p.location[1]}`
    })
  }
  
  console.log('打开高德地图导航:', url)
  console.log('地点数量:', places.length)
  console.log('起点:', start.name, start.location)
  console.log('终点:', end.name, end.location)
  if (places.length > 2) {
    const waypointList = places.slice(1, places.length - 1)
    console.log('途经点:', waypointList.map(p => `${p.name} ${p.location}`))
  }
  
  window.open(url, '_blank')
}

const saveTravelPlan = async () => {
  if (!planResult.value) {
    saveMessage.value = '请先生成旅行计划'
    return
  }
  
  if (!isLoggedIn.value) {
    saveMessage.value = '请先登录'
    openLoginModal()
    return
  }
  
  isSaving.value = true
  saveMessage.value = ''
  
  try {
    const title = planResult.value.split('\n')[0]?.substring(0, 50) || '未命名规划'
    const placesToSave = savedPlaces.value ? JSON.parse(JSON.stringify(savedPlaces.value)) : []
    
    const result = await travelPlanService.savePlan(
      title,
      planResult.value,
      placesToSave,
      { location: travelInput.value }
    )
    
    if (result.success) {
      saveMessage.value = '保存成功！'
      setTimeout(() => {
        saveMessage.value = ''
      }, 2000)
    } else {
      saveMessage.value = result.message || '保存失败'
    }
  } catch (error) {
    console.error('保存失败:', error)
    saveMessage.value = '保存失败，请稍后重试'
  } finally {
    isSaving.value = false
  }
}



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
  savedPlaces.value = [] // 重置保存的地点
  
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
    // 第0步：根据用户输入生成初步旅行计划
    console.log('第0步：生成初步旅行计划...')
    const preliminaryPlan = await amapService.generatePreliminaryPlan(travelInput.value)
    
    if (isCancelled) return
    console.log('初步旅行计划:', preliminaryPlan)

    // 第一步：从初步旅行计划中提取地点和城市信息
    console.log('第一步：从初步计划中提取地点和城市信息...')
    const placesAndCities = await amapService.extractPlacesAndCitiesFromInput(preliminaryPlan)
    
    if (isCancelled) return
    
    if (!placesAndCities || !placesAndCities.places || placesAndCities.places.length === 0) {
      errorMessage.value = '未能从您的输入中识别出地点，请更明确地提及地点名称'
      isLoading.value = false
      return
    }
    
    console.log('提取到的地点和城市:', placesAndCities)

    // 第二步：对城市名用关键字搜索，用搜索结果的cityname替换原来的城市名
    console.log('第二步：验证城市并用高德城市替代...')
    const cities = [...new Set(placesAndCities.places.map(p => p.city).filter(city => city))]
    
    // 用于存储城市映射：原始城市名 -> 高德城市名
    const cityNameMap = {}
    let cityPOIs = []
    
    if (cities.length > 0) {
      for (let i = 0; i < cities.length; i++) {
        if (isCancelled) return
        
        const originalCity = cities[i]
        try {
          // 对城市名本身进行关键字搜索（不限制类型）
          const pois = await amapService.verifyCity(originalCity, 5)
          if (pois && pois.length > 0) {
            // 从第一个POI中获取高德地图的cityname
            const gaodeCity = pois[0].city
            cityNameMap[originalCity] = gaodeCity
            console.log(`城市验证：原始城市 "${originalCity}" -> 高德城市 "${gaodeCity}"`)
            cityPOIs = [...cityPOIs, ...pois]
          }
        } catch (error) {
          console.warn(`验证城市失败: ${originalCity}`, error)
        }
        
        // 增加一点延迟避免API限流
        if (cities.length > 1 && i < cities.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }
    
    if (isCancelled) return
    console.log('城市映射:', cityNameMap)
    console.log(`城市POI搜索找到${cityPOIs.length}个`)
    
    // 更新placesAndCities中的城市名，用高德城市名替代
    placesAndCities.places = placesAndCities.places.map(placeObj => {
      if (cityNameMap[placeObj.city]) {
        return {
          ...placeObj,
          city: cityNameMap[placeObj.city]
        }
      }
      return placeObj
    })
    console.log('更新后的地点和城市:', placesAndCities)

    // 第三步：对每个地点在其城市下进行关键字搜索，返回前10个结果
    console.log('第三步：在城市内关键字搜索...')
    let allSearchResults = []
    for (let i = 0; i < placesAndCities.places.length; i++) {
      if (isCancelled) return
      
      const placeObj = placesAndCities.places[i]
      const searchResults = await amapService.keywordSearchInCity(placeObj.place, placeObj.city, 10)
      if (searchResults.length > 0) {
        allSearchResults = [...allSearchResults, ...searchResults]
      }
      
      // 增加一点延迟避免API限流
      if (placesAndCities.places.length > 1 && i < placesAndCities.places.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    if (isCancelled) return
    
    // 合并城市POI和关键字搜索结果
    let combinedResults = [...cityPOIs, ...allSearchResults]
    console.log(`合并后共${combinedResults.length}个搜索结果`)

    // 第四步：调用大模型，根据用户输入、第一次输出和所有搜索结果筛选地点并生成旅行计划
    console.log('第四步：生成旅行计划...')
    
    const poisForLLM = combinedResults.map(poi => ({
      name: poi.name,
      address: poi.address,
      location: poi.locationStr,
      city: poi.city
    }))

    const response = await cloudbase.callFunction({
      name: 'ai-proxy',
      data: {
        action: 'chat',
        messages: [
          {
            role: 'system',
            content: generateFinalPlanPrompt
          },
          {
            role: 'user',
            content: JSON.stringify({
              userOriginalInput: travelInput.value,
              preliminaryPlan: preliminaryPlan,
              userExtractedPlaces: placesAndCities.places,
              availablePOIs: poisForLLM
            })
          }
        ],
        model: 'astron-code-latest',
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      }
    })

    if (!response || response.code !== 200) {
      throw new Error(response?.message || 'AI服务调用失败')
    }

    const responseData = response.data

    if (isCancelled) return

    const planContent = responseData.choices[0].message.content.trim()
    
    // 在显示时去掉经纬度信息部分，但保留完整内容用于路径规划
    const separatorIndex = planContent.indexOf('---')
    if (separatorIndex !== -1) {
      planResult.value = planContent.substring(0, separatorIndex).trim()
    } else {
      planResult.value = planContent
    }

    // 从计划中提取关键地点并显示地图
    console.log('解析关键地点并显示地图...')
    const keyLocations = amapService.parseKeyLocationsFromPlan(planContent)
    
    if (keyLocations.length < 2) {
      console.warn('关键地点数量不足，尝试使用搜索结果中的地点生成路线')
      // 尝试使用搜索结果中的地点
      const fallbackLocations = combinedResults.slice(0, 8).map(poi => ({
        name: poi.name,
        location: poi.location
      }))
      
      if (fallbackLocations.length >= 2) {
        savedPlaces.value = fallbackLocations
        showMap.value = true
        await showRouteOnMap(fallbackLocations)
      } else {
        errorMessage.value = '计划生成成功，但未能解析出足够的地点用于地图显示'
      }
      isLoading.value = false
      return
    }
    
    savedPlaces.value = keyLocations
    showMap.value = true
    await showRouteOnMap(keyLocations)

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
  if (isCancelled) {
    try { map.destroy() } catch (e) {}
    return
  }
  
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
    
    // 创建 DragRoute
    currentDragRoute = new window.AMap.DragRoute(map, path, window.AMap.DrivingPolicy.LEAST_FEE)
    
    // 保存原始地点名称映射
    const originalNames = places.map((place, index) => place.name || `地点${index + 1}`)
    
    // 监听路径规划完成事件（初始加载和拖动后都会触发）
    currentDragRoute.on('complete', function(e) {
      console.log('路线规划完成')
      
      // 从 e.data 获取最新的起点、途经点、终点
      const newPlaces = []
      
      // 起点
      if (e.data && e.data.start) {
        const startLoc = e.data.start.location
        newPlaces.push({
          name: originalNames[0] || '起点',
          location: [startLoc.lng, startLoc.lat]
        })
      }
      
      // 途经点
      if (e.data && e.data.waypoints && e.data.waypoints.length > 0) {
        e.data.waypoints.forEach((wp, index) => {
          newPlaces.push({
            name: originalNames[index + 1] || `途经点${index + 1}`,
            location: [wp.location.lng, wp.location.lat]
          })
        })
      }
      
      // 终点
      if (e.data && e.data.end) {
        const endLoc = e.data.end.location
        newPlaces.push({
          name: originalNames[originalNames.length - 1] || '终点',
          location: [endLoc.lng, endLoc.lat]
        })
      }
      
      console.log('保存的地点:', newPlaces)
      savedPlaces.value = newPlaces
    })
    
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
  } else if (route.query.plan) {
    // 复现旅行规划
    try {
      const planData = JSON.parse(decodeURIComponent(route.query.plan))
      console.log('复现规划数据:', planData)
      
      if (planData.content) {
        planResult.value = planData.content
      }
      
      if (planData.places && planData.places.length > 0) {
        savedPlaces.value = planData.places
        showMap.value = true
        setTimeout(() => {
          showRouteOnMap(planData.places)
        }, 300)
      }
    } catch (error) {
      console.error('复现规划失败:', error)
    }
  }
  initMap()
})

onBeforeUnmount(() => {
  // 设置取消标志，停止所有操作
  // 终止所有生成进程
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
  
  // 终止所有AMap服务
  amapService.destroy()
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
            <router-link to="/travel-plan">规划</router-link>
          </li>
          <li v-if="!isLoggedIn">
            <a href="#" @click.prevent="openLoginModal">登录</a>
          </li>
          <li v-else class="user-menu">
            <div class="user-info" @click="goToProfile">
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
            
            <!-- 可编辑的计划文本 -->
            <div class="plan-display">
              <textarea 
                v-model="planResult" 
                class="edit-textarea"
                rows="8"
              ></textarea>
              <div class="plan-actions">
                <button class="btn-primary" @click="saveTravelPlan" :disabled="isSaving">
                  {{ isSaving ? '保存中...' : '保存计划' }}
                </button>
                <button class="btn-amap" @click="openAmapNavigation" :disabled="!savedPlaces || savedPlaces.length < 2">
                  在高德地图查看路线
                </button>
              </div>
              <div class="save-tip">提示：您可以在地图上拖动途径点调整路线，保存时会保存您调整后的位置</div>
              <div v-if="saveMessage" class="save-message">{{ saveMessage }}</div>
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

.btn-primary {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: background 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-primary:disabled {
  background: var(--border-light);
  cursor: not-allowed;
}

.btn-amap {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: linear-gradient(135deg, #3284ff 0%, #1a73e8 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-amap:hover:not(:disabled) {
  background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
}

.btn-amap:disabled {
  background: var(--border-light);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.plan-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
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

.plan-display {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.plan-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.edit-textarea {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.edit-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.save-message {
  padding: var(--spacing-xs);
  background: rgba(46, 204, 113, 0.1);
  color: #27ae60;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  text-align: center;
}

.save-tip {
  padding: var(--spacing-xs);
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
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
