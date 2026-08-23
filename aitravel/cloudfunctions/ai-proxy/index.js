const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: process.env.TCB_ENV || cloudbase.SYMBOL_CURRENT_ENV
})

// 讯飞星辰 MaaS 推理服务 API 配置 - 密钥存放在云端，不暴露给前端
// OpenAI 兼容端点：maas-api.cn-huabei-1.xf-yun.com/v2/chat/completions
const SPARK_API_URL = 'https://maas-api.cn-huabei-1.xf-yun.com/v2/chat/completions'

// 从环境变量获取API密钥，如果没有设置环境变量则使用默认值
// 注意：您需要在云函数配置中设置 SPARK_API_KEY 环境变量
const SPARK_API_KEY = process.env.SPARK_API_KEY || '11319299b0674fed8cb178a2f7047233:MzljMjVmMDU1YjVjNDQ4YmMyODYwYmJk'

console.log('AI Proxy function initialized. API Key set:', SPARK_API_KEY ? 'Yes (from environment)' : 'No (using default)')

exports.main = async (event, context) => {
  const { action } = event

  try {
    switch (action) {
      case 'chat':
        return await handleChat(event)
      default:
        return { code: 400, message: '未知操作，支持: chat' }
    }
  } catch (error) {
    console.error('AI proxy error:', error)
    return { code: 500, message: 'AI服务调用失败', error: error.message }
  }
}

async function handleChat(event) {
  const { messages, model, temperature, max_tokens, top_p, frequency_penalty, stream } = event

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return { code: 400, message: 'messages参数不能为空' }
  }

  const requestBody = {
    model: model || 'xopqwen36v35b',
    messages,
    temperature: temperature || 0.7,
    max_completion_tokens: max_tokens || 4096,
    top_p: top_p || 0.95,
    frequency_penalty: frequency_penalty || 0,
    stream: false
  }

  console.log('Calling Spark API:', {
    url: SPARK_API_URL,
    model: requestBody.model,
    messagesCount: messages.length,
    hasApiKey: !!SPARK_API_KEY,
    keyLength: SPARK_API_KEY ? SPARK_API_KEY.length : 0
  })

  try {
    const response = await fetch(SPARK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SPARK_API_KEY}`,
        'X-Failover-Enabled': 'true'
      },
      body: JSON.stringify(requestBody),
      timeout: 30000 // 30秒超时
    })

    console.log('Spark API response status:', response.status, response.statusText)
    
    if (!response.ok) {
      let errorText = 'Unknown error'
      try {
        errorText = await response.text()
        console.error('Spark API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 500)
        })
      } catch (textError) {
        console.error('Failed to read error response body:', textError)
      }
      
      return { 
        code: response.status, 
        message: '讯飞星火API调用失败', 
        error: errorText.substring(0, 200),
        status: response.status,
        statusText: response.statusText
      }
    }

    const data = await response.json()
    console.log('Spark API success:', {
      hasChoices: !!(data.choices && data.choices.length > 0),
      tokensUsed: data.usage?.total_tokens,
      model: data.model
    })
    return { code: 200, data }
  } catch (error) {
    console.error('Spark API fetch error:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 200)
    })
    return { 
      code: 500, 
      message: '讯飞星火API调用失败', 
      error: error.message || 'Unknown network error'
    }
  }
}
