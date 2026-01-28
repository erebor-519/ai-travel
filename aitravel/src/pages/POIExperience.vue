<script setup>
import { ref } from 'vue'

// 模拟景点体验数据
const poiExperience = {
  id: 1,
  name: '故宫深度游',
  location: '北京',
  description: '带你深入了解故宫的历史文化，探索不为人知的秘密角落，感受皇家宫殿的恢弘气势。',
  images: [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Forbidden%20City%20palace%20halls%20ancient%20Chinese%20architecture%20detailed%20view&image_size=landscape_16_9',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Forbidden%20City%20imperial%20gardens%20traditional%20Chinese%20landscape&image_size=landscape_16_9',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Forbidden%20City%20cultural%20relics%20antiques%20exhibition&image_size=landscape_16_9'
  ],
  duration: '4小时',
  price: '¥298/人',
  rating: 4.9,
  reviews: 1256,
  included: [
    '专业导游讲解',
    '故宫深度游路线',
    '特色午餐',
    '文化纪念品'
  ],
  highlights: [
    '参观珍宝馆，欣赏皇家珍藏',
    '探索故宫未开放区域',
    '了解皇家生活礼仪',
    '学习传统建筑知识'
  ],
  reviewsList: [
    {
      id: 1,
      user: '张三',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=asian%20male%20traveler%20portrait&image_size=square',
      rating: 5,
      comment: '导游讲解非常专业，学到了很多历史知识，故宫真的很震撼！',
      date: '2026-01-20'
    },
    {
      id: 2,
      user: '李四',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=asian%20female%20traveler%20portrait&image_size=square',
      rating: 4,
      comment: '体验很棒，就是人有点多，建议早点去。',
      date: '2026-01-18'
    }
  ]
}

const currentImageIndex = ref(0)

const nextImage = () => {
  currentImageIndex.value = (currentImageIndex.value + 1) % poiExperience.images.length
}

const prevImage = () => {
  currentImageIndex.value = (currentImageIndex.value - 1 + poiExperience.images.length) % poiExperience.images.length
}

const handleBooking = () => {
  // 这里可以添加预订逻辑
  alert('预订功能开发中...')
}
</script>

<template>
  <div class="poi-experience-page">
    <div class="poi-header">
      <h1>{{ poiExperience.name }}</h1>
      <div class="poi-meta">
        <span class="location">{{ poiExperience.location }}</span>
        <span class="duration">{{ poiExperience.duration }}</span>
        <span class="rating">
          ⭐ {{ poiExperience.rating }} ({{ poiExperience.reviews }}条评价)
        </span>
      </div>
    </div>

    <div class="poi-content">
      <!-- 左侧图片展示 -->
      <div class="poi-images">
        <div class="main-image">
          <img :src="poiExperience.images[currentImageIndex]" :alt="poiExperience.name" />
          <button class="image-nav prev" @click="prevImage">‹</button>
          <button class="image-nav next" @click="nextImage">›</button>
        </div>
        <div class="thumbnails">
          <div 
            v-for="(image, index) in poiExperience.images" 
            :key="index"
            class="thumbnail"
            :class="{ active: index === currentImageIndex }"
            @click="currentImageIndex = index"
          >
            <img :src="image" :alt="`${poiExperience.name} ${index + 1}`" />
          </div>
        </div>
      </div>

      <!-- 右侧信息 -->
      <div class="poi-info">
        <div class="poi-description">
          <h2>体验介绍</h2>
          <p>{{ poiExperience.description }}</p>
        </div>

        <div class="poi-details">
          <h3>行程包含</h3>
          <ul class="included-list">
            <li v-for="(item, index) in poiExperience.included" :key="index">
              ✅ {{ item }}
            </li>
          </ul>
        </div>

        <div class="poi-highlights">
          <h3>体验亮点</h3>
          <ul class="highlights-list">
            <li v-for="(highlight, index) in poiExperience.highlights" :key="index">
              ⭐ {{ highlight }}
            </li>
          </ul>
        </div>

        <div class="poi-booking">
          <div class="price">{{ poiExperience.price }}</div>
          <button class="book-btn" @click="handleBooking">立即预订</button>
        </div>
      </div>
    </div>

    <!-- 评价区域 -->
    <div class="reviews-section">
      <h2>用户评价</h2>
      <div class="reviews-list">
        <div 
          v-for="review in poiExperience.reviewsList" 
          :key="review.id"
          class="review-card"
        >
          <div class="review-header">
            <img :src="review.avatar" :alt="review.user" class="user-avatar" />
            <div class="review-meta">
              <h4>{{ review.user }}</h4>
              <div class="review-rating">
                <span v-for="i in 5" :key="i" class="star">
                  {{ i <= review.rating ? '★' : '☆' }}
                </span>
              </div>
              <span class="review-date">{{ review.date }}</span>
            </div>
          </div>
          <p class="review-comment">{{ review.comment }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.poi-experience-page {
  padding: var(--spacing-lg);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.poi-header {
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.poi-header h1 {
  font-size: var(--font-size-3xl);
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.poi-meta {
  display: flex;
  justify-content: center;
  gap: var(--spacing-xl);
  flex-wrap: wrap;
}

.poi-meta span {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
}

.location::before {
  content: '📍 ';
  margin-right: 0.25rem;
}

.duration::before {
  content: '⏱️ ';
  margin-right: 0.25rem;
}

.rating {
  color: var(--warning-color) !important;
}

.poi-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
}

.poi-images {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.main-image {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  height: 400px;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-nav:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-50%) scale(1.1);
}

.image-nav.prev {
  left: 1rem;
}

.image-nav.next {
  right: 1rem;
}

.thumbnails {
  display: flex;
  gap: var(--spacing-sm);
}

.thumbnail {
  flex: 1;
  height: 80px;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.thumbnail:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.thumbnail.active {
  border-color: var(--primary-color);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poi-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.poi-description h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-xl);
}

.poi-description p {
  color: var(--text-secondary);
  line-height: 1.6;
}

.poi-details h3,
.poi-highlights h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-lg);
}

.included-list,
.highlights-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.included-list li,
.highlights-list li {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.poi-booking {
  background: var(--bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  align-items: center;
}

.price {
  font-size: var(--font-size-2xl);
  font-weight: bold;
  color: var(--primary-color);
}

.book-btn {
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

.book-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.reviews-section {
  margin-top: var(--spacing-2xl);
}

.reviews-section h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-xl);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.review-card {
  background: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.review-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.review-meta h4 {
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.review-rating {
  color: var(--warning-color);
  font-size: var(--font-size-sm);
  margin-bottom: 0.25rem;
}

.review-date {
  color: var(--text-light);
  font-size: var(--font-size-xs);
}

.review-comment {
  color: var(--text-secondary);
  line-height: 1.6;
}

@media (max-width: 1024px) {
  .poi-content {
    grid-template-columns: 1fr;
  }
  
  .main-image {
    height: 300px;
  }
}

@media (max-width: 768px) {
  .poi-meta {
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  .thumbnails {
    flex-direction: column;
    height: auto;
  }
  
  .thumbnail {
    height: 60px;
  }
}
</style>