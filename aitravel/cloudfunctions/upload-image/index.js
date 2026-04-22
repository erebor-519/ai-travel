const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: process.env.TCB_ENV || cloudbase.SYMBOL_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { action } = event
  
  try {
    switch (action) {
      case 'upload':
        return await uploadImage(event)
      default:
        return {
          code: 400,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message
    }
  }
}

// 上传图片
async function uploadImage(event) {
  const { fileName, content } = event
  
  if (!fileName || !content) {
    return {
      code: 400,
      message: '缺少文件名或文件内容'
    }
  }
  
  try {
    // 将 base64 转换为 buffer
    const base64Data = content.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    // 上传到云存储
    const cloudPath = `posts/${Date.now()}_${fileName}`
    const uploadResult = await app.uploadFile({
      cloudPath: cloudPath,
      fileContent: buffer
    })
    
    // 获取永久访问链接（设置较长过期时间，实际是永久）
    const tempUrl = await app.getTempFileURL({
      fileList: [uploadResult.fileID],
      expires: 7200 * 24 * 365 // 1年有效期
    })
    
    if (tempUrl.fileList && tempUrl.fileList[0]) {
      let url = tempUrl.fileList[0].tempFileURL
      
      // 如果是临时链接，替换为永久访问格式
      // 腾讯云 COS 临时链接格式: https://xxx.cos.ap-shanghai.myqcloud.com/xxx?sign=xxx
      // 如果 tempFileURL 为空或无效，尝试构建直接访问 URL
      if (!url || url.includes('tempFileURL')) {
        // 从 fileID 构建直接访问 URL
        url = `https://${process.env.TCB_ENV || app.config.envId}-1308671790.cos.ap-shanghai.myqcloud.com/${cloudPath}`
      }
      
      return {
        code: 200,
        message: '上传成功',
        data: {
          fileID: uploadResult.fileID,
          url: url
        }
      }
    } else {
      return {
        code: 500,
        message: '获取文件URL失败'
      }
    }
  } catch (error) {
    console.error('上传图片失败:', error)
    return {
      code: 500,
      message: '上传图片失败',
      error: error.message
    }
  }
}
