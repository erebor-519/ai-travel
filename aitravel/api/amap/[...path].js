export default async function handler(req, res) {
  const { path } = req.query
  const pathString = Array.isArray(path) ? path.join('/') : path

  try {
    const queryParams = new URLSearchParams(req.query)
    queryParams.delete('path') // 移除 path 参数
    
    const apiUrl = `https://restapi.amap.com/${pathString}?${queryParams.toString()}`
    
    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('AMAP API Error:', response.status, errorData)
      return res.status(response.status).json({ error: errorData })
    }

    const data = await response.json()
    return res.status(200).json(data)
    
  } catch (error) {
    console.error('AMAP Proxy Error:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
