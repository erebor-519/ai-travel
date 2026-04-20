const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: process.env.TCB_ENV || cloudbase.SYMBOL_CURRENT_ENV
})

const db = app.database()
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  const { action } = event
  
  try {
    switch (action) {
      case 'register':
        return await handleRegister(event)
      case 'login':
        return await handleLogin(event)
      case 'logout':
        return await handleLogout(event)
      case 'getUser':
        return await getUser(event)
      default:
        return {
          code: 400,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('Auth error:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message
    }
  }
}

// 用户注册
async function handleRegister(event) {
  const { username, email, password, nickname } = event
  
  // 验证参数
  if (!username || !email || !password) {
    return {
      code: 400,
      message: '缺少必要参数'
    }
  }
  
  if (password.length < 6) {
    return {
      code: 400,
      message: '密码长度至少6位'
    }
  }
  
  // 检查用户名是否已存在
  const existingUser = await usersCollection.where({
    username: username
  }).get()
  
  if (existingUser.data.length > 0) {
    return {
      code: 400,
      message: '用户名已存在'
    }
  }
  
  // 检查邮箱是否已存在
  const existingEmail = await usersCollection.where({
    email: email
  }).get()
  
  if (existingEmail.data.length > 0) {
    return {
      code: 400,
      message: '邮箱已被注册'
    }
  }
  
  // 创建新用户
  const newUser = {
    username,
    email,
    password: password, // 注意：实际项目中应该加密存储
    nickname: nickname || username,
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20icon&image_size=square',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: null
  }
  
  const result = await usersCollection.add(newUser)
  
  // 返回用户信息（不包含密码）
  const userInfo = {
    userId: result.id,
    username: newUser.username,
    nickname: newUser.nickname,
    email: newUser.email,
    avatar: newUser.avatar,
    createdAt: newUser.createdAt
  }
  
  return {
    code: 200,
    message: '注册成功',
    data: userInfo
  }
}

// 用户登录
async function handleLogin(event) {
  const { username, password } = event
  
  if (!username || !password) {
    return {
      code: 400,
      message: '缺少用户名或密码'
    }
  }
  
  // 查询用户
  const queryResult = await usersCollection.where({
    username: username,
    password: password
  }).get()
  
  if (queryResult.data.length === 0) {
    return {
      code: 401,
      message: '用户名或密码错误'
    }
  }
  
  const user = queryResult.data[0]
  
  // 更新最后登录时间
  await usersCollection.doc(user._id).update({
    lastLoginAt: new Date().toISOString()
  })
  
  // 返回用户信息（不包含密码）
  const userInfo = {
    userId: user._id,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    avatar: user.avatar,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  }
  
  return {
    code: 200,
    message: '登录成功',
    data: userInfo
  }
}

// 用户登出
async function handleLogout(event) {
  // 前端本地清理，这里只是返回成功
  return {
    code: 200,
    message: '登出成功'
  }
}

// 获取用户信息
async function getUser(event) {
  const { userId } = event
  
  if (!userId) {
    return {
      code: 400,
      message: '缺少用户ID'
    }
  }
  
  const queryResult = await usersCollection.doc(userId).get()
  
  if (!queryResult.data) {
    return {
      code: 404,
      message: '用户不存在'
    }
  }
  
  const user = queryResult.data
  
  // 返回用户信息（不包含密码）
  const userInfo = {
    userId: user._id,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    avatar: user.avatar,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  }
  
  return {
    code: 200,
    message: '获取用户信息成功',
    data: userInfo
  }
}