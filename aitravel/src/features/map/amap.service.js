// 高德地图服务
class AMapService {
  constructor() {
    this.map = null;
    this.loaded = false;
    this.loadPromise = null;
    this.webKey = '2d2b4eba69cd250f810caedccec09db1'; // Web端key - 用于JavaScript API
    this.serviceKey = '2ca47c5535532f4bb5134dc7af4dcb92'; // Web服务key - 用于地理编码、路径规划
    
    // 设置安全密钥
    if (!window._AMapSecurityConfig) {
      window._AMapSecurityConfig = {
        securityJsCode: '49b1e1860ca6fe3ce62911c2ce619345',
      };
    }
  }

  // 加载高德地图SDK
  loadSDK() {
    if (this.loaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // 检查是否已经加载
      if (window.AMap) {
        this.loaded = true;
        resolve();
        return;
      }

      // 创建脚本标签
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${this.webKey}&plugin=AMap.DragRoute,AMap.Driving`;
      script.async = true;
      script.defer = true;

      // 保存脚本标签引用
      this.scriptTag = script;

      // 加载成功
      script.onload = () => {
        this.loaded = true;
        resolve();
      };

      // 加载失败
      script.onerror = () => {
        reject(new Error('高德地图SDK加载失败'));
      };

      // 添加到文档
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  // 路径规划服务
  async getRoutePlan(origin, destination, waypoints = []) {
    // 使用高德地图Web服务API进行路径规划
    try {
      // 构造途径点参数
      const waypointsParam = waypoints.length > 0 ? `&waypoints=${waypoints.map(p => p.join(',')).join('|')}` : '';
      
      const response = await fetch(`https://restapi.amap.com/v3/direction/driving?origin=${origin.join(',')}&destination=${destination.join(',')}${waypointsParam}&key=${this.serviceKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === '1' && data.route && data.route.paths && data.route.paths.length > 0) {
        const path = data.route.paths[0];
        
        // 收集所有路径点
        const allPathPoints = [];
        path.steps.forEach(step => {
          if (step.polyline) {
            const points = step.polyline.split(';').map(p => {
              const [lng, lat] = p.split(',');
              return [parseFloat(lng), parseFloat(lat)];
            });
            allPathPoints.push(...points);
          }
        });
        
        return {
          routes: [{
            distance: path.distance,
            time: path.time,
            steps: path.steps.map(step => ({
              instruction: step.instruction,
              path: step.polyline ? step.polyline.split(';').map(p => {
                const [lng, lat] = p.split(',');
                return [parseFloat(lng), parseFloat(lat)];
              }) : []
            })),
            allPathPoints: allPathPoints
          }]
        };
      } else {
        throw new Error(`路径规划失败: ${data.info || '未知错误'}`);
      }
    } catch (error) {
      console.error('路径规划失败:', error);
      throw error;
    }
  }

  // 地理编码服务
  async geocode(address, city = '') {
    // 不加载SDK，直接使用fetch调用高德地图地理编码API
    const cityParam = city ? `&city=${encodeURIComponent(city)}` : '';
    const response = await fetch(`https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}${cityParam}&key=${this.serviceKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      const geocode = data.geocodes[0];
      const [lngStr, latStr] = geocode.location.split(',');
      
      // 验证坐标格式有效性
      if (!lngStr || !latStr) {
        throw new Error(`无效的坐标格式: ${geocode.location}`);
      }
      
      const lng = parseFloat(lngStr);
      const lat = parseFloat(latStr);
      
      if (isNaN(lng) || isNaN(lat)) {
        throw new Error(`无效的坐标值: ${geocode.location}`);
      }
      
      return {
        location: [lng, lat]
      };
    } else {
      throw new Error(`地理编码失败: ${data.info || '未知错误'}`);
    }
  }

  // 解析旅行计划中的地点
  async parseTravelPlan(planText) {
    // 直接调用大模型智能提取地点
    try {
      // 使用fetch直接调用Vite代理
      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Failover-Enabled': 'true',
          'Authorization': `Bearer b644c04f33fd3a89ed601ec9cdadfddb:MDM3YTllYWVjZTAwMjY4MTM4ZTlhM2Vm`
        },
        body: JSON.stringify({
          messages: [
            {
              'role': 'system',
              'content': '你是一个地点提取和旅行路线规划专家，请从以下旅行计划中提取最重要的16个以内主要的，适合高德地图检索的地点（优先选择著名景点）并严格按旅行计划顺序进行排序。如地点不在中国大陆则翻译提取的地点和各项信息为当地的语言。\n\n要求：\n1. 每个地点一行\n2. 尽量包含完整的地点名称（如：故宫博物院、西湖风景名胜区）\n3. 每个地点前面附加所在城市，如不在中国大陆则要在前面附加国家或地区并使用当地的语言，如国家为美国就翻译成英语，例(USA San Francisco Golden Gate Bridge)，格式为：城市/国家/地区 地点名称，例（上海 东方明珠）。严格遵循上述格式\n4. 只提取真实存在的旅游景点\n5. 不要提取通用词汇（如：酒店、餐厅、市区）\n6. 确保地点名称准确，避免错别字\n\n输出格式示例：\n北京 故宫博物院\n杭州 西湖风景名胜区\n西安 兵马俑'
            },
            {
              'role': 'user',
              'content': `旅行计划：${planText}\n\n请提取最重要的主要景点。`
            }
          ],
          model: 'astron-code-latest',
          stream: false,
          max_completion_tokens: 2024,
          temperature: 0.6,
          top_p: 0.95,
          frequency_penalty: 0
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('大模型完整响应:', data);
      
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content.trim();
        console.log('大模型返回的地点:', content);
        
        // 处理大模型返回的地点
        let aiPlaces = content.split('\n').map(place => place.trim()).filter(place => {
          // 过滤掉太短或无效的地点
          if (place.length < 2) return false;
          
          // 过滤掉常见的非地点词汇
          const excludeWords = ['酒店', '餐厅', '市区', '市中心', '郊区', '机场', '车站', 
                                '火车站', '汽车站', '商店', '超市', '商场', '公园', 
                                '广场', '街道', '马路', '路', '街', '巷', '弄',
                                '早餐', '午餐', '晚餐', '吃饭', '住宿', '入住',
                                '第一天', '第二天', '第三天', '第四天', '第五天',
                                '上午', '下午', '晚上', '早上', '中午', '傍晚'];
          
          for (const word of excludeWords) {
            if (place === word || place.includes(word) && place.length === word.length) {
              return false;
            }
          }
          
          // 过滤掉纯数字或标点符号
          if (/^[0-9\s\.\,\-\!\?\。\，\、\；\：\「\」\『\』\（\）\【\】]+$/.test(place)) {
            return false;
          }
          
          return true;
        });
        
        console.log('初步过滤后的地点:', aiPlaces);
        
        // 如果只有一个地点，尝试从旅行计划中提取更多地点
        if (aiPlaces.length === 1) {
          console.log('只有一个地点，尝试从旅行计划中提取更多地点');
          const place = aiPlaces[0];
          // 尝试从旅行计划中提取更多地点
          const morePlaces = planText.match(/(?:在|于|到|参观|游览|游玩|前往|抵达|去往)\s*(.*?)[\s\n\-。，、；：]/g);
          if (morePlaces) {
            morePlaces.forEach(match => {
              const newPlace = match.replace(/(?:在|于|到|参观|游览|游玩|前往|抵达|去往)\s*/, '').trim();
              // 验证新地点
              if (newPlace && newPlace.length > 2 && newPlace !== place && 
                  !aiPlaces.includes(newPlace)) {
                // 再次检查是否是非地点词汇
                const excludeWords = ['酒店', '餐厅', '市区', '市中心', '郊区', '机场', '车站'];
                let isValid = true;
                for (const word of excludeWords) {
                  if (newPlace === word) {
                    isValid = false;
                    break;
                  }
                }
                if (isValid) {
                  aiPlaces.push(newPlace);
                }
              }
            });
          }
        }
        
        // 如果没有提取到地点，直接使用大模型返回的内容
        if (aiPlaces.length === 0) {
          console.log('没有提取到地点，直接使用大模型返回的内容');
          aiPlaces = [content.trim()];
        }
        
        console.log('提取的地点列表:', aiPlaces);
        
        // 去重
        const uniqueAIPlaces = [...new Set(aiPlaces)];
        
        // 限制地点数量，最多8个
        const limitedAIPlaces = uniqueAIPlaces;

        console.log('去重后的地点:', uniqueAIPlaces);
        console.log('限制后的地点:', limitedAIPlaces);
        
        // 解析地点，提取纯地点名称（用于地理编码）和显示名称
        const parsedPlaces = limitedAIPlaces.map(fullPlace => {
          let displayName = fullPlace;
          let geocodeName = fullPlace;
          let city = '';
          
          // 首先尝试解析格式：城市 地点名称（空格分隔）
          const spaceMatch = fullPlace.match(/^(\S+?)\s+(.+)$/);
          if (spaceMatch) {
            city = spaceMatch[1].trim();
            geocodeName = spaceMatch[2].trim();
            displayName = fullPlace;
            console.log(`解析地点: ${fullPlace} -> 地点名称: ${geocodeName}, 城市: ${city}`);
          } else {
            // 如果没有空格分隔，尝试解析格式：地点名称（城市名）
            const match = fullPlace.match(/^(.+?)[（(](.+?)[）)]$/);
            if (match) {
              displayName = fullPlace;
              geocodeName = match[1].trim();
              city = match[2].trim();
              console.log(`解析地点: ${fullPlace} -> 地点名称: ${geocodeName}, 城市: ${city}`);
            }
          }
          
          return {
            displayName: displayName,
            geocodeName: geocodeName,
            city: city
          };
        });
        
        console.log('解析后的地点列表:', parsedPlaces);
        
        // 地理编码
        const geocodedAIPlaces = [];
        for (let i = 0; i < parsedPlaces.length; i++) {
          const placeObj = parsedPlaces[i];
          const place = placeObj.geocodeName;
          const city = placeObj.city;
          try {
            // 增加延迟，避免超过API调用限制（从300ms增加到600ms）
            await new Promise(resolve => setTimeout(resolve, i * 600));
            const geocode = await this.geocode(place, city);
            if (geocode && geocode.location) {
              console.log(`地理编码成功: ${place} (${city || '未指定城市'}) -> ${geocode.location}`);
              geocodedAIPlaces.push({
                name: placeObj.displayName,
                location: geocode.location
              });
            } else {
              console.warn(`无法解析地点: ${place} - 地理编码返回null`);
            }
          } catch (error) {
            if (error.message.includes('CUQPS_HAS_EXCEEDED_THE_LIMIT')) {
              console.warn(`地点 ${place} 超过API调用限制，稍后重试`);
              // 尝试重试一次，增加更长的延迟（从2000ms增加到3000ms）
              await new Promise(resolve => setTimeout(resolve, 3000));
              try {
                const geocode = await this.geocode(place, city);
                if (geocode && geocode.location) {
                  console.log(`地理编码成功(重试): ${place} (${city || '未指定城市'}) -> ${geocode.location}`);
                  geocodedAIPlaces.push({
                    name: placeObj.displayName,
                    location: geocode.location
                  });
                }
              } catch (retryError) {
                console.warn(`重试失败: ${place}`, retryError);
              }
            } else {
              console.warn(`无法解析地点: ${place}`, error);
            }
          }
        }
        
        const filteredPlaces = geocodedAIPlaces.filter(place => place !== null);
        console.log('最终地理编码成功的地点:', filteredPlaces);

        if (filteredPlaces.length === 0) {
          console.warn('未找到任何可地理编码的有效地点');
        }
        
        return filteredPlaces;
      } else {
        console.error('大模型响应格式错误:', data);
        throw new Error('大模型响应格式错误');
      }
    } catch (error) {
      console.error('调用大模型提取地点失败:', error);
      return [];
    }
  }

  // 初始化地图
  async initMap(container, options = {}) {
    try {
      // 确保SDK已加载
      await this.loadSDK();

      // 默认配置
      const defaultOptions = {
        zoom: 11,
        center: [116.397428, 39.90923], // 默认北京
        resizeEnable: true
      };

      // 合并配置
      const mapOptions = { ...defaultOptions, ...options };

      // 创建地图实例
      this.map = new window.AMap.Map(container, mapOptions);

      // 添加默认控件
      if (window.AMap.Scale) {
        this.map.addControl(new window.AMap.Scale());
      }
      if (window.AMap.ToolBar) {
        this.map.addControl(new window.AMap.ToolBar());
      }
      if (window.AMap.MapType) {
        this.map.addControl(new window.AMap.MapType());
      }

      return this.map;
    } catch (error) {
      console.error('地图初始化失败:', error);
      throw error;
    }
  }

  // 获取地图实例
  getMap() {
    return this.map;
  }

  // 设置中心点
  setCenter(lng, lat) {
    if (this.map) {
      this.map.setCenter([lng, lat]);
    }
  }

  // 设置缩放级别
  setZoom(zoom) {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  // 添加标记
  addMarker(position, options = {}) {
    if (!this.map) {
      return null;
    }

    const marker = new window.AMap.Marker({
      position,
      ...options
    });

    marker.setMap(this.map);
    return marker;
  }

  // 清理
  destroy() {
    if (this.map) {
      // 高德地图实例的清理方法
      this.map.destroy();
      this.map = null;
    }
    // 移除SDK脚本标签（需在loadSDK中添加this.scriptTag = script）
    if (this.scriptTag && this.scriptTag.parentNode) {
      this.scriptTag.parentNode.removeChild(this.scriptTag);
      this.scriptTag = null;
    }
    // 清理全局AMAP对象
    if (window.AMap) {
      delete window.AMap;
    }
    this.loaded = false;
    this.loadPromise = null;
  }
}

// 导出单例
const amapService = new AMapService();
export default amapService;