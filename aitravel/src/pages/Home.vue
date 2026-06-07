<script setup>
import MapView from '../features/map/MapView.vue'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const mapLoaded = ref(false)
const mapError = ref(null)
const router = useRouter()
const travelInput = ref('')

const handleMapLoaded = (mapInstance) => {
  console.log('地图加载成功:', mapInstance)
  mapLoaded.value = true
}

const handleMapError = (error) => {
  console.error('地图加载失败:', error)
  mapError.value = error.message
}

const destinations = computed(() => [
  { name: t('home.destinations.beijing'), description: t('home.destinations.beijingDesc'), icon: '🏛️' },
  { name: t('home.destinations.shanghai'), description: t('home.destinations.shanghaiDesc'), icon: '🌆' },
  { name: t('home.destinations.chengdu'), description: t('home.destinations.chengduDesc'), icon: '🍲' }
])

const handleDestinationClick = (dest) => {
  router.push({ 
    name: 'Explore', 
    query: { q: encodeURIComponent(dest.name) } 
  })
}

const handleGeneratePlan = () => {
  if (travelInput.value.trim()) {
    router.push({ 
      name: 'TravelPlan', 
      query: { input: encodeURIComponent(travelInput.value) } 
    })
  } else {
    alert(t('common.pleaseEnter'))
  }
}
</script>

<template>
  <div class="home-page">
    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 左侧地图区域 -->
      <section class="map-section">
        <h2>{{ t('common.map') }}</h2>
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
        <h2>{{ t('common.aiRecommend') }}</h2>
        <div class="ai-card">
          <h3>{{ t('common.destinationRecommend') }}</h3>

          <ul class="destination-list">
            <li v-for="(dest, index) in destinations" :key="index" class="destination-item" @click="handleDestinationClick(dest)">
              <span class="destination-icon">{{ dest.icon }}</span>
              <div class="destination-info">
                <h4>{{ dest.name }}</h4>
                <p>{{ dest.description }}</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div class="ai-card">
          <h3>{{ t('common.travelPlanner') }}</h3>
          <p>{{ t('home.description') }}</p>
          <input 
            v-model="travelInput"
            type="text" 
            :placeholder="locale === 'zh-CN' ? '例如：北京5日游，喜欢历史文化' : 'e.g.: 5-day tour in Beijing, interested in history and culture'"
            class="travel-input" 
          />
          <button class="generate-btn" @click="handleGeneratePlan">
            {{ t('common.generatePlan') }}
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
  cursor: pointer;
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