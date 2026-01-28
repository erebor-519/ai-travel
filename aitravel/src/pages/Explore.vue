<script setup>
import { ref } from 'vue'

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

const handleSearch = () => {
  // 这里可以添加搜索逻辑
  console.log('搜索:', searchQuery.value)
}
</script>

<template>
  <div class="explore-page">
    <div class="explore-header">
      <h1>探索目的地</h1>
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索景点、城市或体验" 
          class="search-input"
        />
        <button class="search-btn" @click="handleSearch">搜索</button>
      </div>
    </div>

    <div class="destinations-grid">
      <div 
        v-for="destination in popularDestinations" 
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
          <button class="explore-btn">了解更多</button>
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

.search-input {
  flex: 1;
  padding: var(--spacing-md);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
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

.search-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
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

@media (max-width: 768px) {
  .destinations-grid {
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