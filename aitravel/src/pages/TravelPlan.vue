<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import OpenAI from 'openai'
import AMapService from '../features/map/amap.service.js'

window._AMapSecurityConfig = {
  securityJsCode: '49b1e1860ca6fe3ce62911c2ce619345',
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

const amapService = AMapService

const client = new OpenAI({
  baseURL: 'http://footmarks.world/api',
  apiKey: 'b644c04f33fd3a89ed601ec9cdadfddb:MDM3YTllYWVjZTAwMjY4MTM4ZTlhM2Vm',
  defaultHeaders: { 'X-Failover-Enabled': 'true' },
  dangerouslyAllowBrowser: true
})

const analysis_system_prompt = `你是一个专业的旅行规划师，擅长根据用户需求生成详细的旅行计划。请按照以下格式输出：

# 旅行计划标题

## 行程概览
- 总天数：X天
- 预算范围：XXX
- 旅行主题：XXX

## 每日行程

### Day 1
- 上午：[活动内容] - [地点] - [时间]
- 下午：[活动内容] - [地点] - [时间]
- 晚上：[活动内容] - [地点] - [时间]

### Day 2
...以此类推

## 注意事项
1. [注意事项1]
2. [注意事项2]
...

请确保计划详细、合理，符合用户的需求。`

const generateTravelPlan = async () => {
  if (!travelInput.value.trim()) {
    errorMessage.value = '请输入旅行需求'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  planResult.value = ''
  showMap.value = false

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
      frequency_penalty: 0
    })

    const content = response.choices[0].message.content.trim()
    planResult.value = content
  } catch (error) {
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

const generateRoutePlan = async () => {
  if (!planResult.value) {
    routeErrorMessage.value = '请先生成旅行计划'
    return
  }

  isRouteLoading.value = true
  routeErrorMessage.value = ''

  try {
    const places = await amapService.parseTravelPlan(planResult.value)

    if (places.length < 2) {
      console.log('提取的地点数量不足:', places.length, '地点:', places);
      routeErrorMessage.value = '无法从旅行计划中提取足够的地点，请确保计划中包含明确的地点信息'
      return
    }

    showMap.value = true
    await showRouteOnMap(places)
  } catch (error) {
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
    isRouteLoading.value = false
  }
}

const showRouteOnMap = async (places) => {
  await new Promise(resolve => setTimeout(resolve, 200))

  const mapContainer = document.getElementById('container')
  if (!mapContainer) {
    return
  }

  await amapService.loadSDK()

  const path = places.map(place => place.location)

  let map
  if (window.currentMap) {
    map = window.currentMap
    map.clearMap()
  } else {
    map = new window.AMap.Map("container", {
      resizeEnable: true
    })
    window.currentMap = map
  }

  window.AMap.plugin("AMap.DragRoute", function() {
    const dragRoute = new window.AMap.DragRoute(map, path, window.AMap.DrivingPolicy.LEAST_FEE)
    dragRoute.search()
    
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
  }
}

onMounted(() => {
  if (route.query.input) {
    travelInput.value = decodeURIComponent(route.query.input)
    generateTravelPlan()
  }
  initMap()
})
</script>

<template>
  <div class="travel-plan-page">
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
              {{ isLoading ? '生成中...' : '生成计划' }}
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
            <button 
              class="generate-btn route-btn" 
              @click="generateRoutePlan"
              :disabled="isRouteLoading"
            >
              {{ isRouteLoading ? '生成路径中...' : '生成路径规划' }}
            </button>
          </div>
          
          <div v-if="routeErrorMessage" class="error-message">
            {{ routeErrorMessage }}
          </div>
        </div>
      </div>
      <div class="right-panel">
        <div class="map-section">
          <div id="container"></div>
          <div id="tip" class="tip">请拖拽路径试试</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
html,
body,
#container {
  width: 100%;
  height: 100%;
}

.travel-plan-page {
  height: 100vh;
  overflow: hidden;
}

.content-wrapper {
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
}

.left-panel {
  position: absolute;
  top: 15px;
  left: 15px;
  width: 380px;
  max-width: calc(100vw - 30px);
  max-height: calc(100vh - 30px);
  overflow-y: auto;
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  z-index: 100;
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
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
  font-size: var(--font-size-2xl);
  text-align: center;
}

.input-section {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.travel-input {
  flex: 1;
  min-width: 200px;
  padding: var(--spacing-md);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
}

.generate-btn {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
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
  padding: var(--spacing-md);
  background: var(--error-bg);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.plan-result {
  margin-top: var(--spacing-lg);
}

.plan-result h3 {
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
  font-size: var(--font-size-lg);
}

.plan-content {
  background: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  max-height: 300px;
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
  font-size: var(--font-size-base);
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
}

#container {
  width: 100%;
  height: 100%;
}

.tip {
  background-color: white;
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  font-size: 14px;
}
</style>
