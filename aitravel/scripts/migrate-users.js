// 用户数据迁移脚本 - 将本地 localStorage 用户迁移到 CloudBase 数据库
import { readFileSync, writeFileSync } from 'fs'
import { cloudbase } from '../src/utils/cloudbase.js'

// 读取本地存储的用户数据（模拟从 localStorage 读取）
const getLocalUsers = () => {
  // 模拟从 localStorage 获取数据
  const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null')
  
  console.log('本地用户数据:')
  console.log('注册用户数量:', registeredUsers.length)
  console.log('当前登录用户:', userInfo)
  
  return {
    registeredUsers,
    currentUser: userInfo
  }
}

// 迁移用户到 CloudBase 数据库
const migrateUsersToCloudBase = async (localUsers) => {
  const { registeredUsers } = localUsers
  
  if (registeredUsers.length === 0) {
    console.log('没有本地用户需要迁移')
    return { migrated: 0, skipped: 0, errors: 0 }
  }
  
  const db = cloudbase.database()
  const usersCollection = db.collection('users')
  
  let migrated = 0
  let skipped = 0
  let errors = 0
  
  console.log(`开始迁移 ${registeredUsers.length} 个用户到 CloudBase 数据库...`)
  
  for (const user of registeredUsers) {
    try {
      // 检查用户是否已存在
      const existingUser = await usersCollection.where({
        username: user.username
      }).get()
      
      if (existingUser.data.length > 0) {
        console.log(`用户 ${user.username} 已存在，跳过`)
        skipped++
        continue
      }
      
      // 准备用户数据
      const userData = {
        username: user.username,
        email: user.email || `${user.username}@example.com`,
        password: user.password, // 注意：密码明文存储，仅用于演示
        nickname: user.nickname || user.username,
        avatar: user.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20icon&image_size=square',
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null
      }
      
      // 插入到数据库
      await usersCollection.add(userData)
      console.log(`用户 ${user.username} 迁移成功`)
      migrated++
      
    } catch (error) {
      console.error(`用户 ${user.username} 迁移失败:`, error.message)
      errors++
    }
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log('\n迁移完成:')
  console.log(`成功迁移: ${migrated} 个用户`)
  console.log(`跳过（已存在）: ${skipped} 个用户`)
  console.log(`失败: ${errors} 个用户`)
  
  return { migrated, skipped, errors }
}

// 运行迁移
const runMigration = async () => {
  console.log('=== 用户数据迁移脚本 ===\n')
  
  try {
    // 1. 获取本地用户数据
    console.log('1. 获取本地用户数据...')
    const localUsers = getLocalUsers()
    
    if (localUsers.registeredUsers.length === 0) {
      console.log('没有本地用户需要迁移')
      console.log('\n提示: 请先在浏览器中注册一些用户，然后刷新页面再次运行此脚本')
      return
    }
    
    // 2. 迁移到 CloudBase
    console.log('\n2. 开始迁移到 CloudBase 数据库...')
    const result = await migrateUsersToCloudBase(localUsers)
    
    // 3. 迁移完成后的建议
    console.log('\n3. 迁移完成后的建议:')
    console.log('- 现在可以清除浏览器 localStorage 中的用户数据')
    console.log('- 在新架构中，所有用户数据都存储在 CloudBase 数据库')
    console.log('- 登录/注册功能现在使用云函数进行验证')
    console.log('- 用户数据更安全，可以在多设备间同步')
    
    // 4. 显示如何清除本地数据
    console.log('\n4. 清除本地数据的方法:')
    console.log('在浏览器控制台中执行:')
    console.log('  localStorage.removeItem("registeredUsers")')
    console.log('  localStorage.removeItem("userInfo")')
    console.log('  localStorage.removeItem("userId")')
    
  } catch (error) {
    console.error('迁移过程中发生错误:', error)
  }
}

// 注意：这个脚本需要在浏览器环境中运行
// 因为需要访问 localStorage 和 CloudBase SDK
console.log('注意: 此脚本需要在浏览器环境中运行')
console.log('在 Vue 组件中调用 runMigration() 函数')
console.log('或者创建一个专门的管理页面来运行迁移')

export { runMigration }