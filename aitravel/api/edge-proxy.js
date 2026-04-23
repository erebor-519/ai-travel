export default async function handler(request, response) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    if (path.startsWith('/api/')) {
      // 代理到火山方舟 API
      const targetPath = path.slice(5); // 去掉 /api/ 前缀
      const targetUrl = `https://maas-coding-api.cn-huabei-1.xf-yun.com/v2/${targetPath}`;
      
      // 处理请求
      const headers = {
        'Content-Type': 'application/json',
        'X-Failover-Enabled': 'true',
        'Authorization': `Bearer b644c04f33fd3a89ed601ec9cdadfddb:MDM3YTllYWVjZTAwMjY4MTM4ZTlhM2Vm`
      };
      
      if (request.method === 'GET') {
        const targetUrlWithParams = `${targetUrl}?${url.searchParams.toString()}`;
        const proxyResponse = await fetch(targetUrlWithParams, { headers });
        const data = await proxyResponse.json();
        response.status(proxyResponse.status).json(data);
      } else if (request.method === 'POST') {
        const body = await request.json();
        const proxyResponse = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });
        const data = await proxyResponse.json();
        response.status(proxyResponse.status).json(data);
      }
    } else if (path.startsWith('/amap/')) {
      // 代理到高德地图 API
      const targetPath = path.slice(6); // 去掉 /amap/ 前缀
      const targetUrl = `https://restapi.amap.com/${targetPath}`;
      
      if (request.method === 'GET') {
        const targetUrlWithParams = `${targetUrl}?${url.searchParams.toString()}`;
        const proxyResponse = await fetch(targetUrlWithParams);
        const data = await proxyResponse.json();
        response.status(proxyResponse.status).json(data);
      }
    } else {
      response.status(404).json({ error: '无效路径' });
    }
  } catch (error) {
    console.error('代理请求失败:', error);
    response.status(500).json({ error: '代理请求失败' });
  }
}
