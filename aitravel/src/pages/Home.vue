<script setup>
import MapView from '../features/map/MapView.vue'
import { ref } from 'vue'

const mapLoaded = ref(false)
const mapError = ref(null)

const handleMapLoaded = (mapInstance) => {
  console.log('地图加载成功:', mapInstance)
  mapLoaded.value = true
}

const handleMapError = (error) => {
  console.error('地图加载失败:', error)
  mapError.value = error.message
}

const destinations = [
  { name: '北京', description: '历史文化名城', icon: '🏛️' },
  { name: '上海', description: '现代都市风情', icon: '🌆' },
  { name: '成都', description: '美食休闲之都', icon: '🍲' },
  { name: '杭州', description: '人间天堂', icon: '西湖' }
]

const handleGeneratePlan = () => {
  // 这里可以添加AI生成旅行计划的逻辑
  alert('生成旅行计划功能开发中...')
}
</script>

<template>
  <div class="home-page">
    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 左侧地图区域 -->
      <section class="map-section">
        <h2>目的地地图</h2>
        <div class="map-wrapper">
          <MapView 
            :center="[116.397428, 39.90923]" 
            :zoom="11"
            :style="{ height: '600px' }"
            @map-loaded="handleMapLoaded"
            @map-error="handleMapError"
          />
          <div v-if="mapError" class="map-error">
            {{ mapError }}
          </div>
        </div>
      </section>

      <!-- 右侧AI助手区域 -->
      <section class="ai-section">
        <h2>AI 旅行推荐</h2>
        <div class="ai-card">
          <h3>智能目的地推荐</h3>
          <p>基于您的偏好，我们为您推荐以下旅行目的地：</p>
          <ul class="destination-list">
            <li v-for="(dest, index) in destinations" :key="index" class="destination-item">
              <span class="destination-icon">{{ dest.icon }}</span>
              <div class="destination-info">
                <h4>{{ dest.name }}</h4>
                <p>{{ dest.description }}</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div class="ai-card">
          <h3>旅行规划助手</h3>
          <p>输入您的旅行需求，AI 将为您生成个性化旅行计划</p>
          <input 
            type="text" 
            placeholder="例如：北京5日游，喜欢历史文化" 
            class="travel-input" 
          />
          <button class="generate-btn" @click="handleGeneratePlan">
            生成计划
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home-page {
  padding: var(--spacing-lg);
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.map-section {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
}

.map-section h2 {
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
  font-size: var(--font-size-xl);
}

.map-wrapper {
  position: relative;
}

.map-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  color: var(--error-color);
  text-align: center;
  z-index: 10;
}

.ai-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.ai-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
}

.ai-card h3 {
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
  font-size: var(--font-size-lg);
}

.ai-card p {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.destination-list {
  margin-top: var(--spacing-md);
}

.destination-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
  transition: all 0.3s ease;
}

.destination-item:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.destination-icon {
  font-size: 2rem;
  margin-right: var(--spacing-md);
  width: 48px;
  text-align: center;
}

.destination-info h4 {
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.destination-info p {
  color: var(--text-light);
  margin: 0;
  font-size: var(--font-size-sm);
}

.travel-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  margin: var(--spacing-md) 0;
  font-size: var(--font-size-base);
}

.travel-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.generate-btn {
  width: 100%;
  padding: var(--spacing-md);
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.generate-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .ai-section {
    order: -1;
  }
}
</style>