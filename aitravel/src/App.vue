<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import LoginModal from './components/LoginModal.vue'

const { t, locale } = useI18n()

// 语言切换
const switchLanguage = (lang) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
}

// 用户登录状态
const isLoggedIn = ref(false)
const userInfo = ref(null)
const showLoginModal = ref(false)

// 检查登录状态
onMounted(() => {
  const storedUserInfo = localStorage.getItem('userInfo')
  if (storedUserInfo) {
    userInfo.value = JSON.parse(storedUserInfo)
    isLoggedIn.value = true
  }
  
  // 定期检查登录状态
  setInterval(() => {
    const storedUserInfo = localStorage.getItem('userInfo')
    const storedUserId = localStorage.getItem('userId')
    
    if (storedUserInfo && storedUserId) {
      try {
        const parsed = JSON.parse(storedUserInfo)
        if (!isLoggedIn.value || (userInfo.value && userInfo.value.userId !== parsed.userId)) {
          userInfo.value = parsed
          isLoggedIn.value = true
        }
      } catch (err) {
        console.error('定期检查失败:', err)
      }
    } else if (isLoggedIn.value) {
      isLoggedIn.value = false
      userInfo.value = null
    }
  }, 1000)
})

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
</script>

<template>
  <div class="app-container">
    <!-- 头部导航 -->
    <header class="header">
      <h1>{{ t('home.title') }}</h1>
      <nav>
        <ul>
          <li>
            <router-link to="/">{{ t('nav.home') }}</router-link>
          </li>
          <li>
            <router-link to="/explore">{{ t('nav.explore') }}</router-link>
          </li>
          <li>
            <router-link to="/poi-experience">{{ t('nav.footmarks') }}</router-link>
          </li>
          <li>
            <router-link to="/travel-plan">{{ t('nav.plan') }}</router-link>
          </li>
          <li class="lang-switch">
            <button @click="switchLanguage('zh-CN')" :class="{ active: locale === 'zh-CN' }">中</button>
            <button @click="switchLanguage('en-US')" :class="{ active: locale === 'en-US' }">EN</button>
          </li>
          <li v-if="!isLoggedIn">
            <a href="#" @click.prevent="openLoginModal">{{ t('common.login') }}</a>
          </li>
          <li v-else class="user-menu">
            <router-link to="/profile" class="user-info">
              <img :src="userInfo.avatar" alt="avatar" class="user-avatar" />
              <span>{{ userInfo.nickname }}</span>
            </router-link>
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

    <!-- 主要内容 - 路由视图 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <p>&copy; 2026 AI 旅行助手 | 让旅行更智能</p>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
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
  position: sticky;
  top: 0;
  z-index: 100;
}

.header h1 {
  font-size: var(--font-size-xl);
  font-weight: 700;
}

.header nav ul {
  display: flex;
  list-style: none;
  gap: var(--spacing-xl);
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

.lang-switch {
  display: flex;
  gap: 4px;
}

.lang-switch button {
  padding: 4px 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: var(--text-white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.lang-switch button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.lang-switch button.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.user-menu {
  display: flex;
  align-items: center;
  position: relative;
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

.dropdown-arrow {
  font-size: 10px;
  margin-left: 4px;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 160px;
  overflow: hidden;
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.3s ease;
  font-size: var(--font-size-sm);
}

.dropdown-item:hover {
  background: var(--bg-secondary);
}

.dropdown-icon {
  font-size: 16px;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-light);
  margin: 4px 0;
}

.logout-item {
  color: var(--error-color);
}

.logout-item:hover {
  background: rgba(231, 76, 60, 0.1);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.main-content {
  flex: 1;
  width: 100%;
}

.footer {
  background: var(--bg-primary);
  color: var(--text-secondary);
  text-align: center;
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
  margin-top: var(--spacing-2xl);
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
}
</style>
