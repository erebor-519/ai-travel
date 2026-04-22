const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: process.env.TCB_ENV || cloudbase.SYMBOL_CURRENT_ENV
})

const db = app.database()
const postsCollection = db.collection('posts')
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  const { action } = event
  
  try {
    switch (action) {
      case 'create':
        return await createPost(event)
      case 'list':
        return await listPosts(event)
      case 'detail':
        return await getPostDetail(event)
      case 'like':
        return await toggleLike(event)
      case 'delete':
        return await deletePost(event)
      case 'my':
        return await getMyPosts(event)
      case 'mylikes':
        return await getMyLikedPosts(event)
      case 'search':
        return await searchPosts(event)
      default:
        return {
          code: 400,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('Forum error:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message
    }
  }
}

// 创建帖子
async function createPost(event) {
  // 解析可能为 JSON 字符串的数组字段
  let { userId, title, content, tags, location, days, budget, places, images } = event
  
  console.log('=== 创建帖子收到的原始数据 ===')
  console.log('event.images:', event.images)
  console.log('event.images 类型:', typeof event.images)
  console.log('images:', images)
  console.log('images 类型:', typeof images)
  
  // 确保数组字段正确解析
  if (typeof tags === 'string') {
    try { tags = JSON.parse(tags) } catch (e) { tags = [] }
  }
  if (typeof places === 'string') {
    try { places = JSON.parse(places) } catch (e) { places = [] }
  }
  if (typeof images === 'string') {
    try { images = JSON.parse(images) } catch (e) { images = [] }
  }
  
  console.log('解析后 images:', images)
  
  // 验证参数
  if (!userId) {
    return {
      code: 401,
      message: '未登录'
    }
  }
  
  if (!title || !content) {
    return {
      code: 400,
      message: '标题和内容不能为空'
    }
  }
  
  // 验证用户是否存在
  const userResult = await usersCollection.doc(userId).get()
  if (!userResult.data) {
    return {
      code: 404,
      message: '用户不存在'
    }
  }
  
  const user = userResult.data[0] || userResult.data
  
  // 创建新帖子
  const newPost = {
    userId,
    userInfo: {
      userId: user._id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar
    },
    title,
    content,
    tags: tags || [],
    location: location || '',
    days: days || 1,
    budget: budget || '',
    places: places || [],  // 保存地点数组
    images: images || [],  // 保存上传的图片
    likes: [],
    likeCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  console.log('云函数保存的 newPost.places:', newPost.places)
  console.log('云函数保存的 newPost.places 长度:', newPost.places ? newPost.places.length : 'undefined')
  console.log('云函数保存的 newPost.images:', newPost.images)
  
  const result = await postsCollection.add(newPost)
  
  // 返回帖子信息
  const postInfo = {
    postId: result.id,
    userId: newPost.userId,
    userInfo: newPost.userInfo,
    title: newPost.title,
    content: newPost.content,
    tags: newPost.tags,
    location: newPost.location,
    days: newPost.days,
    budget: newPost.budget,
    places: newPost.places,
    images: newPost.images,
    likes: newPost.likes,
    likeCount: newPost.likeCount,
    createdAt: newPost.createdAt,
    updatedAt: newPost.updatedAt
  }
  
  return {
    code: 200,
    message: '帖子创建成功',
    data: postInfo
  }
}

// 获取帖子列表
async function listPosts(event) {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = event
  
  const skip = (page - 1) * limit
  
  // 构建排序条件
  const sort = {}
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1
  
  // 查询帖子
  const query = postsCollection
    .orderBy(sortBy, sortOrder)
    .skip(skip)
    .limit(limit)
  
  const result = await query.get()
  
  // 获取用户信息
  const postsWithUserInfo = await Promise.all(
    result.data.map(async (post) => {
      try {
        // 如果帖子中已经包含用户信息，直接使用
        if (post.userInfo && post.userInfo.userId) {
          return post
        }
        
        // 确保帖子有必要的字段
        const processedPost = {
          _id: post._id || '',
          title: post.title || '',
          content: post.content || '',
          tags: post.tags || [],
          location: post.location || '',
          days: post.days || 1,
          budget: post.budget || '',
          places: post.places || [],  // 包含地点数组
          images: post.images || [],  // 包含图片数组
          likes: post.likes || [],
          likeCount: post.likeCount || 0,
          userId: post.userId || '',
          createdAt: post.createdAt || new Date().toISOString(),
          updatedAt: post.updatedAt || new Date().toISOString()
        }
        
        // 否则查询用户信息
        if (processedPost.userId) {
          const userResult = await usersCollection.doc(processedPost.userId).get()
          if (userResult.data && (userResult.data[0] || userResult.data)) {
            const user = userResult.data[0] || userResult.data
            return {
              ...processedPost,
              userInfo: {
                userId: user._id,
                username: user.username,
                nickname: user.nickname,
                avatar: user.avatar
              }
            }
          }
        }
        
        // 如果用户不存在，返回默认信息
        return {
          ...processedPost,
          userInfo: {
            userId: processedPost.userId || '',
            username: '匿名用户',
            nickname: '匿名用户',
            avatar: ''
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        return {
          ...post,
          _id: post._id || '',
          title: post.title || '',
          content: post.content || '',
          tags: post.tags || [],
          location: post.location || '',
          days: post.days || 1,
          budget: post.budget || '',
          places: post.places || [],
          images: post.images || [],
          likes: post.likes || [],
          likeCount: post.likeCount || 0,
          userId: post.userId || '',
          createdAt: post.createdAt || new Date().toISOString(),
          updatedAt: post.updatedAt || new Date().toISOString(),
          userInfo: {
            userId: post.userId || '',
            username: '未知用户',
            nickname: '未知用户',
            avatar: ''
          }
        }
      }
    })
  )
  
  // 获取总数
  const totalResult = await postsCollection.count()
  
  return {
    code: 200,
    message: '获取帖子列表成功',
    data: {
      posts: postsWithUserInfo,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit)
      }
    }
  }
}

// 获取帖子详情
async function getPostDetail(event) {
  const { postId } = event
  
  if (!postId) {
    return {
      code: 400,
      message: '缺少帖子ID'
    }
  }
  
  const result = await postsCollection.doc(postId).get()
  
  if (!result.data) {
    return {
      code: 404,
      message: '帖子不存在'
    }
  }
  
  return {
    code: 200,
    message: '获取帖子详情成功',
    data: result.data[0] || result.data
  }
}

// 点赞/取消点赞
async function toggleLike(event) {
  const { postId, userId } = event
  
  if (!postId || !userId) {
    return {
      code: 400,
      message: '缺少帖子ID或用户ID'
    }
  }
  
  // 获取帖子
  const postResult = await postsCollection.doc(postId).get()
  if (!postResult.data) {
    return {
      code: 404,
      message: '帖子不存在'
    }
  }
  
  const post = postResult.data[0] || postResult.data
  const likes = post.likes || []
  

  
  // 检查是否已经点赞 - 使用严格比较
  let existingIndex = -1
  for (let i = 0; i < likes.length; i++) {
    console.log(`likes[${i}]:`, likes[i], 'type:', typeof likes[i])
    if (likes[i] === userId) {
      existingIndex = i
      break
    }
  }
  
  console.log('existingIndex (manual):', existingIndex)
  
  if (existingIndex >= 0) {
    // 取消点赞
    likes.splice(existingIndex, 1)
    console.log('取消点赞，新数组:', JSON.stringify(likes))
  } else {
    // 添加点赞
    likes.push(userId)
    console.log('添加点赞，新数组:', JSON.stringify(likes))
  }
  
  // 更新帖子
  await postsCollection.doc(postId).update({
    likes: likes,
    likeCount: likes.length,
    updatedAt: new Date().toISOString()
  })
  
  return {
    code: 200,
    message: existingIndex >= 0 ? '取消点赞成功' : '点赞成功',
    data: {
      liked: existingIndex < 0, // true表示现在是点赞状态，false表示现在是取消点赞状态
      likeCount: likes.length
    }
  }
}

// 删除帖子
async function deletePost(event) {
  const { postId, userId } = event
  
  if (!postId || !userId) {
    return {
      code: 400,
      message: '缺少帖子ID或用户ID'
    }
  }
  
  // 验证帖子是否存在且属于该用户
  const postResult = await postsCollection.doc(postId).get()
  if (!postResult.data) {
    return {
      code: 404,
      message: '帖子不存在'
    }
  }
  
  const post = postResult.data[0] || postResult.data
  if (post.userId !== userId) {
    return {
      code: 403,
      message: '无权删除此帖子'
    }
  }
  
  // 删除帖子
  await postsCollection.doc(postId).remove()
  
  return {
    code: 200,
    message: '帖子删除成功'
  }
}

// 获取我的帖子
async function getMyPosts(event) {
  const { userId, page = 1, limit = 10 } = event
  
  if (!userId) {
    return {
      code: 401,
      message: '未登录'
    }
  }
  
  const skip = (page - 1) * limit
  
  // 查询用户的帖子
  const query = postsCollection
    .where({
      userId: userId
    })
    .orderBy('createdAt', 'desc')
    .skip(skip)
    .limit(limit)
  
  const result = await query.get()
  
  // 获取总数
  const totalResult = await postsCollection.where({
    userId: userId
  }).count()
  
  return {
    code: 200,
    message: '获取我的帖子成功',
    data: {
      posts: result.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit)
      }
    }
  }
}

// 获取我点赞的帖子
async function getMyLikedPosts(event) {
  const { userId, page = 1, limit = 10 } = event
  
  if (!userId) {
    return {
      code: 401,
      message: '未登录'
    }
  }
  
  const skip = (page - 1) * limit
  
  // 查询用户点赞的帖子（likes 数组包含用户ID）
  const query = postsCollection
    .where({
      likes: userId
    })
    .orderBy('createdAt', 'desc')
    .skip(skip)
    .limit(limit)
  
  const result = await query.get()
  
  // 获取总数
  const totalResult = await postsCollection.where({
    likes: userId
  }).count()
  
  // 处理用户信息
  const postsWithUserInfo = await Promise.all(
    result.data.map(async (post) => {
      try {
        if (post.userInfo && post.userInfo.userId) {
          return post
        }
        
        const processedPost = {
          _id: post._id || '',
          title: post.title || '',
          content: post.content || '',
          tags: post.tags || [],
          location: post.location || '',
          days: post.days || 1,
          budget: post.budget || '',
          places: post.places || [],
          likes: post.likes || [],
          likeCount: post.likeCount || 0,
          userId: post.userId || '',
          createdAt: post.createdAt || new Date().toISOString(),
          updatedAt: post.updatedAt || new Date().toISOString()
        }
        
        if (processedPost.userId) {
          const userResult = await usersCollection.doc(processedPost.userId).get()
          if (userResult.data && (userResult.data[0] || userResult.data)) {
            const user = userResult.data[0] || userResult.data
            return {
              ...processedPost,
              userInfo: {
                userId: user._id,
                username: user.username,
                nickname: user.nickname,
                avatar: user.avatar
              }
            }
          }
        }
        
        return {
          ...processedPost,
          userInfo: {
            userId: processedPost.userId || '',
            username: '匿名用户',
            nickname: '匿名用户',
            avatar: ''
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        return {
          ...post,
          _id: post._id || '',
          title: post.title || '',
          content: post.content || '',
          tags: post.tags || [],
          location: post.location || '',
          days: post.days || 1,
          budget: post.budget || '',
          places: post.places || [],
          likes: post.likes || [],
          likeCount: post.likeCount || 0,
          userId: post.userId || '',
          createdAt: post.createdAt || new Date().toISOString(),
          updatedAt: post.updatedAt || new Date().toISOString(),
          userInfo: {
            userId: post.userId || '',
            username: '未知用户',
            nickname: '未知用户',
            avatar: ''
          }
        }
      }
    })
  )
  
  return {
    code: 200,
    message: '获取我点赞的帖子成功',
    data: {
      posts: postsWithUserInfo,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit)
      }
    }
  }
}

// 搜索帖子
async function searchPosts(event) {
  const { keyword, page = 1, limit = 10 } = event
  
  if (!keyword) {
    return {
      code: 400,
      message: '搜索关键词不能为空'
    }
  }
  
  const skip = (page - 1) * limit
  
  // 使用正则表达式进行模糊搜索（不区分大小写）
  // 搜索标题、内容、标签、地点、用户名
  const query = postsCollection
    .where({
      $or: [
        { title: db.RegExp({ regexp: keyword, options: 'i' }) },
        { content: db.RegExp({ regexp: keyword, options: 'i' }) },
        { tags: db.RegExp({ regexp: keyword, options: 'i' }) },
        { location: db.RegExp({ regexp: keyword, options: 'i' }) },
        { 'userInfo.nickname': db.RegExp({ regexp: keyword, options: 'i' }) },
        { 'userInfo.username': db.RegExp({ regexp: keyword, options: 'i' }) }
      ]
    })
    .orderBy('createdAt', 'desc')
    .skip(skip)
    .limit(limit)
  
  const result = await query.get()
  
  // 处理用户信息
  const postsWithUserInfo = await Promise.all(
    result.data.map(async (post) => {
      try {
        if (post.userInfo && post.userInfo.userId) {
          return post
        }
        
        const processedPost = {
          _id: post._id || '',
          title: post.title || '',
          content: post.content || '',
          tags: post.tags || [],
          location: post.location || '',
          days: post.days || 1,
          budget: post.budget || '',
          places: post.places || [],
          images: post.images || [],
          likes: post.likes || [],
          likeCount: post.likeCount || 0,
          userId: post.userId || '',
          createdAt: post.createdAt || new Date().toISOString(),
          updatedAt: post.updatedAt || new Date().toISOString()
        }
        
        if (processedPost.userId) {
          const userResult = await usersCollection.doc(processedPost.userId).get()
          if (userResult.data && (userResult.data[0] || userResult.data)) {
            const user = userResult.data[0] || userResult.data
            return {
              ...processedPost,
              userInfo: {
                userId: user._id,
                username: user.username,
                nickname: user.nickname,
                avatar: user.avatar
              }
            }
          }
        }
        
        return {
          ...processedPost,
          userInfo: {
            userId: processedPost.userId || '',
            username: '匿名用户',
            nickname: '匿名用户',
            avatar: ''
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        return {
          ...post,
          _id: post._id || '',
          title: post.title || '',
          content: post.content || '',
          tags: post.tags || [],
          location: post.location || '',
          days: post.days || 1,
          budget: post.budget || '',
          places: post.places || [],
          images: post.images || [],
          likes: post.likes || [],
          likeCount: post.likeCount || 0,
          userId: post.userId || '',
          createdAt: post.createdAt || new Date().toISOString(),
          updatedAt: post.updatedAt || new Date().toISOString(),
          userInfo: {
            userId: post.userId || '',
            username: '未知用户',
            nickname: '未知用户',
            avatar: ''
          }
        }
      }
    })
  )
  
  // 获取搜索结果的总数
  const totalResult = await postsCollection
    .where({
      $or: [
        { title: db.RegExp({ regexp: keyword, options: 'i' }) },
        { content: db.RegExp({ regexp: keyword, options: 'i' }) },
        { tags: db.RegExp({ regexp: keyword, options: 'i' }) },
        { location: db.RegExp({ regexp: keyword, options: 'i' }) },
        { 'userInfo.nickname': db.RegExp({ regexp: keyword, options: 'i' }) },
        { 'userInfo.username': db.RegExp({ regexp: keyword, options: 'i' }) }
      ]
    })
    .count()
  
  return {
    code: 200,
    message: '搜索帖子成功',
    data: {
      posts: postsWithUserInfo,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit)
      }
    }
  }
}