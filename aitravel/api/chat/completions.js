export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const requestBody = req.body
    const apiUrl = 'https://maas-coding-api.cn-huabei-1.xf-yun.com/v2/chat/completions'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
        'X-Failover-Enabled': req.headers['x-failover-enabled'] || 'true'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('API Error:', response.status, errorData)
      return res.status(response.status).json({ error: errorData })
    }

    const data = await response.json()
    return res.status(200).json(data)
    
  } catch (error) {
    console.error('Proxy Error:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
