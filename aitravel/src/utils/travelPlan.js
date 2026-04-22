import { cloudbase } from './cloudbase.js'

class TravelPlanService {
  constructor() {
    this.functionName = 'travel-plans'
  }

  // 保存旅行规划
  async savePlan(title, content, places, options = {}) {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      return {
        success: false,
        message: '请先登录'
      }
    }

    try {
      const result = await cloudbase.callFunction({
        name: this.functionName,
        data: {
          action: 'save',
          userId,
          title,
          content,
          places,  // 地点数组
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

  // 获取我的旅行规划列表
  async getMyPlans(page = 1, limit = 10) {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      return {
        success: false,
        message: '请先登录'
      }
    }

    try {
      const result = await cloudbase.callFunction({
        name: this.functionName,
        data: {
          action: 'list',
          userId,
          page,
          limit
        }
      })

      if (result.code === 200) {
        // 将 _id 转换为 id，方便前端使用
        const plans = (result.data.plans || []).map(plan => ({
          ...plan,
          id: plan._id || plan.id
        }))
        return {
          success: true,
          data: {
            ...result.data,
            plans
          },
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
      console.error('获取旅行规划列表失败:', error)
      return {
        success: false,
        message: '获取旅行规划列表失败，请稍后重试',
        error: error.message
      }
    }
  }

  // 获取规划详情
  async getPlanDetail(id) {
    const userId = localStorage.getItem('userId')

    try {
      const result = await cloudbase.callFunction({
        name: this.functionName,
        data: {
          action: 'detail',
          id,
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
      console.error('获取规划详情失败:', error)
      return {
        success: false,
        message: '获取规划详情失败，请稍后重试',
        error: error.message
      }
    }
  }

  // 删除规划
  async deletePlan(id) {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      return {
        success: false,
        message: '请先登录'
      }
    }

    try {
      // 确保使用正确的 id（可能是 _id）
      const planId = id._id || id
      
      const result = await cloudbase.callFunction({
        name: this.functionName,
        data: {
          action: 'delete',
          id: planId,
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
      console.error('删除规划失败:', error)
      return {
        success: false,
        message: '删除规划失败，请稍后重试',
        error: error.message
      }
    }
  }
}

export const travelPlanService = new TravelPlanService()
