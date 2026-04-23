import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const path = params.path.join('/');
  
  if (path.startsWith('chat/')) {
    // 代理到火山方舟 API
    const targetUrl = `https://maas-coding-api.cn-huabei-1.xf-yun.com/v2/${path}`;
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-Failover-Enabled': 'true',
          'Authorization': `Bearer b644c04f33fd3a89ed601ec9cdadfddb:MDM3YTllYWVjZTAwMjY4MTM4ZTlhM2Vm`
        }
      });
      return NextResponse.json(await response.json());
    } catch (error) {
      console.error('代理请求失败:', error);
      return NextResponse.json({ error: '代理请求失败' }, { status: 500 });
    }
  }
  
  if (path.startsWith('v3/')) {
    // 代理到高德地图 API
    const targetUrl = `https://restapi.amap.com/${path}`;
    try {
      const response = await fetch(targetUrl);
      return NextResponse.json(await response.json());
    } catch (error) {
      console.error('代理请求失败:', error);
      return NextResponse.json({ error: '代理请求失败' }, { status: 500 });
    }
  }
  
  return NextResponse.json({ error: '无效路径' }, { status: 404 });
}

export async function POST(request, { params }) {
  const path = params.path.join('/');
  
  if (path.startsWith('chat/')) {
    // 代理到火山方舟 API
    const targetUrl = `https://maas-coding-api.cn-huabei-1.xf-yun.com/v2/${path}`;
    try {
      const body = await request.json();
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Failover-Enabled': 'true',
          'Authorization': `Bearer b644c04f33fd3a89ed601ec9cdadfddb:MDM3YTllYWVjZTAwMjY4MTM4ZTlhM2Vm`
        },
        body: JSON.stringify(body)
      });
      return NextResponse.json(await response.json());
    } catch (error) {
      console.error('代理请求失败:', error);
      return NextResponse.json({ error: '代理请求失败' }, { status: 500 });
    }
  }
  
  return NextResponse.json({ error: '无效路径' }, { status: 404 });
}
