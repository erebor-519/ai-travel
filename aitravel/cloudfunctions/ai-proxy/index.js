const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: process.env.TCB_ENV || cloudbase.SYMBOL_CURRENT_ENV
})

// 讯飞星火API配置 - 密钥存放在云端，不暴露给前端
const SPARK_API_URL = 'https://maas-coding-api.cn-huabei-1.xf-yun.com/v2/chat/completions'
const SPARK_API_KEY = process.env.SPARK_API_KEY || 'b644c04f33fd3a89ed601ec9cdadfddb:MDM3YTllYWVjZTAwMjY4MTM4ZTlhM2Vm'

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
    model: model || 'astron-code-latest',
    messages,
    temperature: temperature || 0.7,
    max_completion_tokens: max_tokens || 4096,
    top_p: top_p || 0.95,
    frequency_penalty: frequency_penalty || 0,
    stream: false
  }

  console.log('Calling Spark API, model:', requestBody.model, 'messages:', messages.length)

  const response = await fetch(SPARK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SPARK_API_KEY}`,
      'X-Failover-Enabled': 'true'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Spark API error:', response.status, errorText)
    return { code: response.status, message: '讯飞星火API调用失败', error: errorText }
  }

  const data = await response.json()
  console.log('Spark API success, tokens used:', data.usage?.total_tokens)
  return { code: 200, data }
}
