const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: process.env.TCB_ENV || cloudbase.SYMBOL_CURRENT_ENV
})

const db = app.database()

exports.main = async (event, context) => {
  const { action, ...params } = event
  
  try {
    switch (action) {
      case 'save':
        return await saveTravelPlan(event)
      case 'list':
        return await listTravelPlans(event)
      case 'detail':
        return await getTravelPlanDetail(event)
      case 'delete':
        return await deleteTravelPlan(event)
      default:
        return {
          code: 400,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('TravelPlans error:', error)
    return {
      code: 500,
      message: '服务器内部错误: ' + error.message,
      error: error.message
    }
  }
}

// 保存旅行规划
async function saveTravelPlan(event) {
  const { userId, title, content, places, location, days, budget } = event
  
  if (!userId) {
    return { code: 401, message: '未登录' }
  }
  
  if (!title) {
    return { code: 400, message: '标题不能为空' }
  }
  
  try {
    const collection = db.collection('travel_plans')
    
    const newPlan = {
      userId,
      title,
      content: content || '',
      places: places || [],
      location: location || '',
      days: days || 1,
      budget: budget || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const result = await collection.add(newPlan)
    
    return {
      code: 200,
      message: '规划保存成功',
      data: { id: result.id }
    }
  } catch (error) {
    console.error('Save plan error:', error)
    return {
      code: 500,
      message: '保存失败: ' + error.message,
      error: error.message
    }
  }
}

// 获取用户旅行规划列表
async function listTravelPlans(event) {
  const { userId, page = 1, limit = 10 } = event
  
  if (!userId) {
    return { code: 401, message: '未登录' }
  }
  
  const offset = (parseInt(page) - 1) * parseInt(limit)
  
  try {
    const collection = db.collection('travel_plans')
    
    const queryResult = await collection
      .where({ userId })
      .orderBy('createdAt', 'desc')
      .skip(offset)
      .limit(parseInt(limit))
      .get()
    
    const countResult = await collection
      .where({ userId })
      .count()
    
    return {
      code: 200,
      message: '获取成功',
      data: {
        plans: queryResult.data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total || 0
        }
      }
    }
  } catch (error) {
    console.error('List plans error:', error)
    return {
      code: 500,
      message: '获取失败: ' + error.message
    }
  }
}

// 获取旅行规划详情
async function getTravelPlanDetail(event) {
  const { id, userId } = event
  
  if (!id) {
    return { code: 400, message: '缺少规划ID' }
  }
  
  try {
    const collection = db.collection('travel_plans')
    
    const result = await collection.doc(id).get()
    
    if (!result.data || result.data.length === 0) {
      return { code: 404, message: '规划不存在' }
    }
    
    const plan = result.data[0]
    
    if (userId && plan.userId !== userId) {
      return { code: 403, message: '无权访问' }
    }
    
    return {
      code: 200,
      message: '获取成功',
      data: plan
    }
  } catch (error) {
    console.error('Get detail error:', error)
    return {
      code: 500,
      message: '获取失败: ' + error.message
    }
  }
}

// 删除旅行规划
async function deleteTravelPlan(event) {
  const { id, userId } = event
  
  if (!id || !userId) {
    return { code: 400, message: '缺少参数' }
  }
  
  try {
    const collection = db.collection('travel_plans')
    
    // 先验证权限
    const result = await collection.doc(id).get()
    
    if (!result.data || result.data.length === 0) {
      return { code: 404, message: '规划不存在' }
    }
    
    const plan = result.data[0]
    
    if (plan.userId !== userId) {
      return { code: 403, message: '无权删除' }
    }
    
    await collection.doc(id).remove()
    
    return { code: 200, message: '删除成功' }
  } catch (error) {
    console.error('Delete error:', error)
    return {
      code: 500,
      message: '删除失败: ' + error.message
    }
  }
}
