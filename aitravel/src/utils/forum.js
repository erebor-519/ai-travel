import { cloudbase } from './cloudbase.js'

class ForumService {
  constructor() {
    this.db = cloudbase.database()
  }

  // 创建帖子
  async createPost(postData) {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      return {
        success: false,
        message: '请先登录'
      }
    }

    try {
      // 将 Proxy 对象转换为普通数组
      const places = postData.places ? JSON.parse(JSON.stringify(postData.places)) : []
      const images = postData.images ? JSON.parse(JSON.stringify(postData.images)) : []
      
      const result = await cloudbase.callFunction({
        name: 'forum',
        data: {
          action: 'create',
          userId,
          title: postData.title,
          content: postData.content,
          tags: postData.tags || [],
          location: postData.location || '',
          days: postData.days || 1,
          budget: postData.budget || '',
          places: places,
          images: images
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
      console.error('创建帖子失败:', error)
      return {
        success: false,
        message: '创建帖子失败，请稍后重试',
        error: error.message
      }
    }
  }

  // 保存旅行规划（创建带地点的帖子）
  async saveTravelPlan(title, content, places, options = {}) {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      return {
        success: false,
        message: '请先登录'
      }
    }

    try {
      const result = await cloudbase.callFunction({
        name: 'forum',
        data: {
          action: 'create',
          userId,
          title,
          content,
          places,  // 保存地点数组
          tags: options.tags || [],
          location: options.location || '',
          days: options.days || 1,
          budget: options.budget || ''
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
      console.error('保存旅行规划失败:', error)
      return {
        success: false,
        message: '保存旅行规划失败，请稍后重试',
        error: error.message
      }
    }
  }

  // 获取帖子列表
  async getPosts(page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc') {
    try {
      const result = await cloudbase.callFunction({
        name: 'forum',
        data: {
          action: 'list',
          page,
          limit,
          sortBy,
          sortOrder
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
      console.error('获取帖子列表失败:', error)
      return {
        success: false,
        message: '获取帖子列表失败，请稍后重试',
        error: error.message
      }
    }
  }

  // 获取帖子详情
  async getPostDetail(postId) {
    try {
      const result = await cloudbase.callFunction({
        name: 'forum',
        data: {
          action: 'detail',
          postId
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
      console.error('获取帖子详情失败:', error)
      return {
        success: false,
        message: '获取帖子详情失败，请稍后重试',
        error: error.message
      }
    }
  }

  // 点赞/取消点赞
  async toggleLike(postId) {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      return {
        success: false,
        message: '请先登录'
      }
    }

    try {
      const result = await cloudbase.callFunction({
        name: 'forum',
        data: {
          action: 'like',
          postId,
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
      console.error('点赞失败:', error)
      return {
        success: false,
        message: '点赞失败，请稍后重试',
        error: error.message
      }
    }
  }

  // 删除帖子
  async deletePost(postId) {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      return {
        success: false,
        message: '请先登录'
      }
    }

    try {
      const result = await cloudbase.callFunction({
        name: 'forum',
        data: {
          action: 'delete',
          postId,
          userId
        }
      })

      if (result.code === 200) {
        return {
          success: true,
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
      console.error('删除帖子失败:', error)
      return {
        success: false,
        message: '删除帖子失败，请稍后重试',
        error: error.message
      }
    }
  }

  // 获取我的帖子
  async getMyPosts(page = 1, limit = 10) {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      return {
        success: false,
        message: '请先登录'
      }
    }

    try {
      const result = await cloudbase.callFunction({
        name: 'forum',
        data: {
          action: 'my',
          userId,
          page,
          limit
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
      console.error('获取我的帖子失败:', error)
      return {
        success: false,
        message: '获取我的帖子失败，请稍后重试',
        error: error.message
      }
    }
  }

  // 获取我点赞的帖子
  async getMyLikedPosts(page = 1, limit = 10) {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      return {
        success: false,
        message: '请先登录'
      }
    }

    try {
      const result = await cloudbase.callFunction({
        name: 'forum',
        data: {
          action: 'mylikes',
          userId,
          page,
          limit
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
      console.error('获取我点赞的帖子失败:', error)
      return {
        success: false,
        message: '获取我点赞的帖子失败，请稍后重试',
        error: error.message
      }
    }
  }

  // 检查是否已点赞
  isLiked(post, userId) {
    if (!post || !post.likes || !userId) return false
    return post.likes.includes(userId)
  }

  // 搜索帖子
  async searchPosts(keyword, page = 1, limit = 10) {
    try {
      const result = await cloudbase.callFunction({
        name: 'forum',
        data: {
          action: 'search',
          keyword,
          page,
          limit
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
      console.error('搜索帖子失败:', error)
      return {
        success: false,
        message: '搜索帖子失败，请稍后重试',
        error: error.message
      }
    }
  }
}

export const forumService = new ForumService()