const cloudbase = require('@cloudbase/node-sdk')
const bcrypt = require('bcryptjs')

const app = cloudbase.init({
  env: process.env.TCB_ENV || cloudbase.SYMBOL_CURRENT_ENV
})

const db = app.database()
const usersCollection = db.collection('users')

// 密码加密相关配置
const SALT_ROUNDS = 10

// 输入验证函数
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email) && email.length <= 254
}

function validateUsername(username) {
  if (!username || typeof username !== 'string') return false
  // 放宽用户名限制，允许中文字符和基本标点
  return username.length >= 3 && username.length <= 50
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return false
  return password.length >= 6 && password.length <= 128
}

function sanitizeString(str, maxLength = 100) {
  if (!str || typeof str !== 'string') return ''
  // 移除可能危险的字符，限制长度，允许中文字符
  return str.replace(/[<>:"/\\|?*]/g, '').trim().slice(0, maxLength)
}

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
  
  // 输入验证
  if (!validateUsername(username)) {
    return {
      code: 400,
      message: '用户名格式不正确（3-50个字符，只能包含字母、数字和下划线）'
    }
  }
  
  if (!validateEmail(email)) {
    return {
      code: 400,
      message: '邮箱格式不正确'
    }
  }
  
  if (!validatePassword(password)) {
    return {
      code: 400,
      message: '密码长度应为6-128个字符'
    }
  }
  
  // 清理和验证昵称
  const sanitizedNickname = nickname ? sanitizeString(nickname, 50) : username
  
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
  // 使用 bcrypt 加密密码
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
  
  const newUser = {
    username: sanitizeString(username, 50),
    email: sanitizeString(email, 254),
    password: hashedPassword, // 加密存储密码
    nickname: sanitizedNickname,
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
  
  // 查询用户 - 先尝试精确匹配（支持旧用户）
  let queryResult = await usersCollection.where({
    username: username.trim()
  }).get()
  
  // 如果精确匹配失败，再尝试清理后的用户名（兼容新注册用户）
  if (queryResult.data.length === 0) {
    const cleanedUsername = sanitizeString(username.trim(), 50)
    queryResult = await usersCollection.where({
      username: cleanedUsername
    }).get()
  }
  
  if (queryResult.data.length === 0) {
    return {
      code: 401,
      message: '用户名或密码错误'
    }
  }
  
  const user = queryResult.data[0]
  
  // 添加调试日志
  console.log('登录尝试 - 用户名:', username.trim())
  console.log('登录尝试 - 用户存在:', !!user)
  console.log('登录尝试 - 密码是bcrypt格式:', user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')))
  
  // 兼容旧数据：尝试用 bcrypt 比对密码
  let isPasswordValid = false
  let needsUpgrade = false
  
  try {
  // 检查密码是否是 bcrypt 格式（以 $2a$ 或 $2b$ 开头）
  if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
    // 新密码：使用 bcrypt 比对
    console.log('使用bcrypt比对密码')
    console.log('密码哈希:', user.password.substring(0, 30) + '...')
    isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('bcrypt比对结果:', isPasswordValid)
    } else {
      // 旧密码：明文比对（兼容旧数据）
      console.log('使用明文比对密码')
      if (user.password === password) {
        isPasswordValid = true
        needsUpgrade = true // 标记需要升级密码
        console.log('明文密码比对成功')
      } else {
        console.log('明文密码比对失败')
      }
    }
  } catch (error) {
    console.error('密码比对错误:', error)
    // 如果 bcrypt 比对失败，尝试明文比对（兼容旧数据）
    try {
      if (user.password === password) {
        isPasswordValid = true
        needsUpgrade = true
        console.log('catch块中明文密码比对成功')
      }
    } catch (e) {
      console.error('catch块中明文比对也失败:', e)
    }
  }
  
  if (!isPasswordValid) {
    return {
      code: 401,
      message: '用户名或密码错误'
    }
  }
  
  // 如果旧密码比对成功，自动升级为 bcrypt 加密
  if (needsUpgrade) {
    try {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
      await usersCollection.doc(user._id).update({
        password: hashedPassword
      })
      console.log('用户密码已自动升级为 bcrypt 加密:', user.username)
    } catch (error) {
      console.error('密码升级失败:', error)
      // 升级失败不影响登录，继续执行
    }
  }
  
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