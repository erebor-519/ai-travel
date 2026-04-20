import { cloudbase } from './cloudbase.js'

class AuthService {
  constructor() {
    this.db = cloudbase.database()
    // 注意：CloudBase JS SDK 使用 cloudbase.callFunction() 而不是 cloudbase.functions().callFunction()
  }

  // 用户注册
  async register(userData) {
    const { username, email, password, nickname } = userData
    
    try {
      const result = await cloudbase.callFunction({
        name: 'auth',
        data: {
          action: 'register',
          username,
          email,
          password,
          nickname: nickname || username
        }
      })
      
      if (result.code === 200) {
        // 注册成功后保存用户信息到本地存储
        localStorage.setItem('userInfo', JSON.stringify(result.data))
        localStorage.setItem('userId', result.data.userId)
        return {
          success: true,
          data: result.data,
          message: result.message
        }
      } else {
        return {
          success: false,
          message: result.message,
          code: result.code
        }
      }
    } catch (error) {
      console.error('注册失败:', error)
      return {
        success: false,
        message: '注册失败，请稍后重试',
        error: error.message
      }
    }
  }

  // 用户登录
  async login(username, password) {
    try {
      const result = await cloudbase.callFunction({
        name: 'auth',
        data: {
          action: 'login',
          username,
          password
        }
      })
      
      if (result.code === 200) {
        // 登录成功后保存用户信息到本地存储
        localStorage.setItem('userInfo', JSON.stringify(result.data))
        localStorage.setItem('userId', result.data.userId)
        return {
          success: true,
          data: result.data,
          message: result.message
        }
      } else {
        return {
          success: false,
          message: result.message,
          code: result.code
        }
      }
    } catch (error) {
      console.error('登录失败:', error)
      return {
        success: false,
        message: '登录失败，请稍后重试',
        error: error.message
      }
    }
  }

  // 用户登出
  logout() {
    // 清除本地存储
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userId')
    
    // 调用后端登出接口
    cloudbase.callFunction({
      name: 'auth',
      data: {
        action: 'logout'
      }
    }).catch(error => {
      console.warn('登出请求失败:', error)
    })
    
    return {
      success: true,
      message: '登出成功'
    }
  }

  // 获取当前登录用户信息
  async getCurrentUser() {
    const userId = localStorage.getItem('userId')
    const userInfo = localStorage.getItem('userInfo')
    
    if (!userId || !userInfo) {
      return null
    }
    
    // 从本地存储获取，如果需要最新信息可以调用API
    try {
      const parsedInfo = JSON.parse(userInfo)
      return {
        success: true,
        data: parsedInfo
      }
    } catch (error) {
      console.error('解析用户信息失败:', error)
      return null
    }
  }

  // 检查登录状态
  isLoggedIn() {
    return !!localStorage.getItem('userId') && !!localStorage.getItem('userInfo')
  }

  // 获取用户信息（从后端）
  async getUserInfo(userId) {
    try {
      const result = await cloudbase.callFunction({
        name: 'auth',
        data: {
          action: 'getUser',
          userId
        }
      })
      
      if (result.code === 200) {
        return {
          success: true,
          data: result.data,
          message: result.message
        }
      } else {
        return {
          success: false,
          message: result.message,
          code: result.code
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return {
        success: false,
        message: '获取用户信息失败',
        error: error.message
      }
    }
  }
}

export const authService = new AuthService()