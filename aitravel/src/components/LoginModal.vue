<script setup>
import { ref, computed } from 'vue'
import { authService } from '../utils/auth.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'login'])

const mode = ref('login') // 'login' 或 'register'
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const isLoginMode = computed(() => mode.value === 'login')
const isRegisterMode = computed(() => mode.value === 'register')

const switchMode = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  clearForm()
  errorMessage.value = ''
}

const clearForm = () => {
  username.value = ''
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
}

const handleSubmit = async () => {
  if (isLoginMode.value) {
    await handleLogin()
  } else {
    await handleRegister()
  }
}

const handleLogin = async () => {
  if (!username.value.trim() || !password.value.trim()) {
    errorMessage.value = '请输入用户名和密码'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await authService.login(username.value, password.value)
    
    if (result.success) {
      const userInfo = {
        userId: result.data.userId,
        username: result.data.username,
        nickname: result.data.nickname,
        email: result.data.email,
        avatar: result.data.avatar
      }
      emit('login', userInfo)
      closeModal()
    } else {
      errorMessage.value = result.message || '用户名或密码错误'
    }
  } catch (error) {
    console.error('登录失败:', error)
    errorMessage.value = '登录失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  // 验证表单
  if (!username.value.trim()) {
    errorMessage.value = '请输入用户名'
    return
  }
  if (!email.value.trim()) {
    errorMessage.value = '请输入邮箱'
    return
  }
  if (!password.value.trim()) {
    errorMessage.value = '请输入密码'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }
  if (password.value.length < 6) {
    errorMessage.value = '密码长度至少6位'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await authService.register({
      username: username.value,
      email: email.value,
      password: password.value,
      nickname: username.value
    })
    
    if (result.success) {
      const userInfo = {
        userId: result.data.userId,
        username: result.data.username,
        nickname: result.data.nickname,
        email: result.data.email,
        avatar: result.data.avatar
      }
      emit('login', userInfo)
      closeModal()
    } else {
      errorMessage.value = result.message || '注册失败'
    }
  } catch (error) {
    console.error('注册失败:', error)
    errorMessage.value = '注册失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

const closeModal = () => {
  clearForm()
  errorMessage.value = ''
  mode.value = 'login' // 重置为登录模式
  emit('close')
}

const handleOverlayClick = (e) => {
  if (e.target === e.currentTarget) {
    closeModal()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ isLoginMode ? '用户登录' : '用户注册' }}</h2>
            <button class="close-btn" @click="closeModal">×</button>
          </div>
          
          <div class="modal-body">
            <!-- 模式切换 -->
            <div class="mode-switch">
              <button
                class="mode-btn"
                :class="{ active: isLoginMode }"
                @click="mode = 'login'"
              >
                登录
              </button>
              <button
                class="mode-btn"
                :class="{ active: isRegisterMode }"
                @click="mode = 'register'"
              >
                注册
              </button>
            </div>
            
            <!-- 用户名输入框 -->
            <div class="form-group">
              <label for="username">用户名</label>
              <input
                id="username"
                v-model="username"
                type="text"
                placeholder="请输入用户名"
                @keyup.enter="handleSubmit"
              />
            </div>
            
            <!-- 邮箱输入框（仅注册模式显示） -->
            <div v-if="isRegisterMode" class="form-group">
              <label for="email">邮箱</label>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="请输入邮箱"
                @keyup.enter="handleSubmit"
              />
            </div>
            
            <!-- 密码输入框 -->
            <div class="form-group">
              <label for="password">密码</label>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="请输入密码"
                @keyup.enter="handleSubmit"
              />
            </div>
            
            <!-- 确认密码输入框（仅注册模式显示） -->
            <div v-if="isRegisterMode" class="form-group">
              <label for="confirmPassword">确认密码</label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                @keyup.enter="handleSubmit"
              />
            </div>
            
            <!-- 错误消息 -->
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
            
            <!-- 提交按钮 -->
            <button
              class="submit-btn"
              :disabled="isLoading"
              @click="handleSubmit"
            >
              {{ isLoading ? (isLoginMode ? '登录中...' : '注册中...') : (isLoginMode ? '登录' : '注册') }}
            </button>
            
            <!-- 模式切换提示 -->
            <div class="mode-tips">
              <p v-if="isLoginMode">
                还没有账号？
                <a href="#" @click.prevent="switchMode">立即注册</a>
              </p>
              <p v-else>
                已有账号？
                <a href="#" @click.prevent="switchMode">立即登录</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: var(--spacing-md);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-xl);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-light);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--spacing-lg);
}

.mode-switch {
  display: flex;
  margin-bottom: var(--spacing-lg);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.mode-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-secondary);
  color: var(--text-light);
  border: none;
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: all 0.3s ease;
}

.mode-btn.active {
  background: var(--primary-color);
  color: var(--text-white);
}

.mode-btn:hover:not(.active) {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--text-primary);
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.error-message {
  color: var(--error-color);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  background: rgba(231, 76, 60, 0.1);
  border-radius: var(--radius-sm);
}

.submit-btn {
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

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.mode-tips {
  margin-top: var(--spacing-md);
  text-align: center;
  color: var(--text-light);
  font-size: var(--font-size-sm);
}

.mode-tips a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.mode-tips a:hover {
  text-decoration: underline;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .modal-content,
.fade-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.fade-enter-from .modal-content,
.fade-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
