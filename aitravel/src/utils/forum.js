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
      const result = await cloudbase.callFunction({
        name: 'forum',
        data: {
          action: 'create',
          userId,
          ...postData
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

  // 检查是否已点赞
  isLiked(post, userId) {
    if (!post || !post.likes || !userId) return false
    return post.likes.includes(userId)
  }
}

export const forumService = new ForumService()