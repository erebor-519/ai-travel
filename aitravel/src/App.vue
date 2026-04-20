<script setup>
import { ref, onMounted } from 'vue'
import LoginModal from './components/LoginModal.vue'
import { authService } from './utils/auth.js'

// 用户登录状态
const isLoggedIn = ref(false)
const userInfo = ref(null)
const showLoginModal = ref(false)

// 检查登录状态
onMounted(() => {
  if (authService.isLoggedIn()) {
    authService.getCurrentUser().then(result => {
      if (result) {
        userInfo.value = result.data
        isLoggedIn.value = true
      }
    })
  }
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

// 处理登出
const handleLogout = () => {
  authService.logout()
  userInfo.value = null
  isLoggedIn.value = false
}
</script>

<template>
  <div class="app-container">
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
