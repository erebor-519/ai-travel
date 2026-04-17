<script setup>
// App.vue 只做布局和路由视图，不放业务逻辑
import { Analytics } from '@vercel/analytics/vue';
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
            <router-link to="/poi-experience">景点体验</router-link>
          </li>
          <li>
            <a href="#">关于我们</a>
          </li>
        </ul>
      </nav>
    </header>

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
    
    <!-- Vercel Web Analytics -->
    <Analytics />
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
