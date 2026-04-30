// 高德地图服务
import placeExtractionPrompt from './place-extraction-prompt.md?raw';
import placeValidationPrompt from './place-validation-prompt.md?raw';
import cityExtractionPrompt from './city-extraction-prompt.md?raw';
import extractCitiesFromInputPrompt from './extract-cities-from-input-prompt.md?raw';
import extractKeyPlacesPrompt from './extract-key-places-prompt.md?raw';
import filterKeyPlacesPrompt from './filter-key-places-prompt.md?raw';
import extractPlacesCitiesPrompt from './extract-places-cities-prompt.md?raw';
import preliminaryPlanPrompt from './preliminary-plan-prompt.md?raw';
import { cloudbase } from '../../utils/cloudbase.js';

class AMapService {
  constructor() {
    this.map = null;
    this.loaded = false;
    this.loadPromise = null;
    this.webKey = import.meta.env.VITE_AMAP_WEB_KEY || '2d2b4eba69cd250f810caedccec09db1'; // Web端key - 用于JavaScript API
    this.serviceKey = import.meta.env.VITE_AMAP_SERVICE_KEY || '2ca47c5535532f4bb5134dc7af4dcb92'; // Web服务key - 用于地理编码、路径规划
    
    // 设置安全密钥
    if (!window._AMapSecurityConfig) {
      window._AMapSecurityConfig = {
        securityJsCode: import.meta.env.VITE_AMAP_SECURITY_JS_CODE || '49b1e1860ca6fe3ce62911c2ce619345',
      };
    }
  }

  // 通过CloudBase云函数调用AI（密钥存放在云端，不暴露给前端）
  async callAI(messages, options = {}) {
    const {
      model = 'astron-code-latest',
      temperature = 0.7,
      max_completion_tokens = 4096,
      top_p = 0.95,
      frequency_penalty = 0
    } = options;

    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`callAI 第${attempt}次尝试...`);
        const result = await cloudbase.callFunction({
          name: 'ai-proxy',
          data: {
            action: 'chat',
            messages,
            model,
            temperature,
            max_tokens: max_completion_tokens,
            top_p,
            frequency_penalty,
            stream: false
          }
        });

        if (!result || result.code !== 200) {
          throw new Error(result?.message || '云函数调用失败');
        }

        console.log(`callAI 第${attempt}次尝试成功`);
        return result.data;
      } catch (error) {
        console.error(`callAI 第${attempt}次尝试失败:`, error);
        lastError = error;
        
        // 如果不是最后一次尝试，等待一段时间后重试
        if (attempt < maxRetries) {
          const delayMs = 500 * attempt; // 指数退避
          console.log(`等待${delayMs}ms后重试...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    // 所有尝试都失败
    throw lastError || new Error('AI调用失败，已达到最大重试次数');
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
      
      const response = await fetch(`/amap/v3/direction/driving?origin=${origin.join(',')}&destination=${destination.join(',')}${waypointsParam}&key=${this.serviceKey}`, {
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

  // POI搜索服务（风景名胜）
  async geocode(address, city = '', poiType = '') {
    // 使用高德地图POI搜索API
    const cityParam = city ? `&city=${encodeURIComponent(city)}` : '';
    // 如果有指定POI类型，就只用该类型；否则用默认类型组合
    const typesParam = poiType ? `&types=${encodeURIComponent(poiType)}` : '&types=风景名胜区|风景名胜|景点|历史遗迹|博物馆|公园广场|观景点|文化场馆|公园|寺庙|教堂|古迹|古建筑|世界遗产|酒店|宾馆|民宿|青旅|餐饮|中餐厅|西餐厅|咖啡馆|快餐|商场|购物中心|便利店|地铁站|火车站|机场|汽车站|停车场|厕所|银行|医院';
    const response = await fetch(`/amap/v3/place/text?keywords=${encodeURIComponent(address)}${cityParam}${typesParam}&offset=1&page=1&key=${this.serviceKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === '1' && data.pois && data.pois.length > 0) {
      const poi = data.pois[0];
      const [lngStr, latStr] = poi.location.split(',');
      
      // 验证坐标格式有效性
      if (!lngStr || !latStr) {
        throw new Error(`无效的坐标格式: ${poi.location}`);
      }
      
      const lng = parseFloat(lngStr);
      const lat = parseFloat(latStr);
      
      if (isNaN(lng) || isNaN(lat)) {
        throw new Error(`无效的坐标值: ${poi.location}`);
      }
      
      console.log(`POI搜索成功: ${address} (${city || '未指定城市'}, ${poiType || '默认类型'}) -> ${poi.name}, ${poi.location}`);
      return {
        location: [lng, lat],
        foundPlace: poi.name,
        foundAddress: poi.address || '',
        foundLocation: poi.location,
        originalPlace: address,
        originalCity: city,
        originalType: poiType
      };
    } else {
      // 如果POI搜索没有找到，尝试使用地理编码作为备选方案
      console.warn(`未找到POI (${poiType || '默认类型'})，尝试地理编码: ${address}`);
      const geocodeResult = await this.fallbackGeocode(address, city);
      return {
        ...geocodeResult,
        originalPlace: address,
        originalCity: city,
        originalType: poiType
      };
    }
  }

  // 地理编码服务（备选方案）
  async fallbackGeocode(address, city = '') {
    const cityParam = city ? `&city=${encodeURIComponent(city)}` : '';
    const response = await fetch(`/amap/v3/geocode/geo?address=${encodeURIComponent(address)}${cityParam}&key=${this.serviceKey}`, {
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
      
      if (!lngStr || !latStr) {
        throw new Error(`无效的坐标格式: ${geocode.location}`);
      }
      
      const lng = parseFloat(lngStr);
      const lat = parseFloat(latStr);
      
      if (isNaN(lng) || isNaN(lat)) {
        throw new Error(`无效的坐标值: ${geocode.location}`);
      }
      
      console.log(`地理编码成功(备选): ${address} -> ${geocode.formatted_address}, ${geocode.location}`);
      return {
        location: [lng, lat],
        foundPlace: geocode.formatted_address || address,
        foundAddress: geocode.formatted_address || '',
        foundLocation: geocode.location
      };
    } else {
      throw new Error(`POI搜索和地理编码均失败: ${data.info || '未知错误'}`);
    }
  }

  // 周边搜索服务
  async searchAround(keywords, location, radius = 1000, poiType = '') {
    // 使用高德地图周边搜索API
    const typesParam = poiType ? `&types=${encodeURIComponent(poiType)}` : '&types=风景名胜区|风景名胜|景点|历史遗迹|博物馆|公园广场|观景点|文化场馆|公园|寺庙|教堂|古迹|古建筑|世界遗产';
    const response = await fetch(`/amap/v3/place/around?keywords=${encodeURIComponent(keywords)}&location=${location}&radius=${radius}${typesParam}&offset=20&page=1&key=${this.serviceKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === '1' && data.pois && data.pois.length > 0) {
      const pois = data.pois.map(poi => {
        const [lngStr, latStr] = poi.location.split(',');
        const lng = parseFloat(lngStr);
        const lat = parseFloat(latStr);
        
        return {
          id: poi.id,
          name: poi.name,
          address: poi.address,
          location: [lng, lat],
          locationStr: poi.location,
          type: poi.type,
          businessArea: poi.business_area,
          city: poi.cityname,
          adcode: poi.adcode,
          distance: poi.distance
        };
      });
      
      console.log(`周边搜索成功: ${keywords} (${location}, radius: ${radius}) -> ${pois.length}个地点`);
      return pois;
    } else {
      console.warn(`周边搜索未找到结果: ${keywords} (${location}, radius: ${radius})`);
      return [];
    }
  }

  // POI详情查询服务
  async getPOIDetail(poiId) {
    const response = await fetch(`/amap/v3/place/detail?id=${poiId}&key=${this.serviceKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === '1' && data.pois && data.pois.length > 0) {
      const poi = data.pois[0];
      const [lngStr, latStr] = poi.location.split(',');
      const lng = parseFloat(lngStr);
      const lat = parseFloat(latStr);
      
      console.log(`POI详情查询成功: ${poiId} -> ${poi.name}`);
      return {
        id: poi.id,
        name: poi.name,
        address: poi.address,
        location: [lng, lat],
        locationStr: poi.location,
        type: poi.type,
        businessArea: poi.business_area,
        city: poi.cityname,
        adcode: poi.adcode,
        postcode: poi.postcode,
        tel: poi.tel,
        website: poi.website,
        email: poi.email,
        pcode: poi.pcode,
        pname: poi.pname,
        adname: poi.adname,
        importance: poi.importance,
        photos: poi.photos || []
      };
    } else {
      throw new Error(`POI详情查询失败: ${data.info || '未知错误'}`);
    }
  }

  // 从用户输入提取城市
  async extractCitiesFromInput(userInput) {
    try {
      const data = await this.callAI([
        { role: 'system', content: extractCitiesFromInputPrompt },
        { role: 'user', content: userInput }
      ], { temperature: 0.3, max_completion_tokens: 2000 });

      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content.trim();
        try {
          const result = JSON.parse(content);
          console.log('从输入提取到的城市:', result.cities);
          return result.cities || [];
        } catch (parseError) {
          console.warn('解析城市响应失败:', parseError);
          return [];
        }
      }
      return [];
    } catch (error) {
      console.warn('从输入提取城市失败，继续执行:', error);
      return [];
    }
  }

  // 搜索城市POI
  async searchCityPOIs(city, poiTypes = '风景名胜区|风景名胜|景点|历史遗迹|博物馆|公园广场|观景点|文化场馆|公园|寺庙|教堂|古迹|古建筑|世界遗产', limit = 30) {
    const response = await fetch(`/amap/v3/place/text?keywords=景点&city=${encodeURIComponent(city)}&types=${encodeURIComponent(poiTypes)}&offset=${limit}&page=1&key=${this.serviceKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === '1' && data.pois && data.pois.length > 0) {
      const pois = data.pois.map(poi => {
        const [lngStr, latStr] = poi.location.split(',');
        const lng = parseFloat(lngStr);
        const lat = parseFloat(latStr);
        
        return {
          id: poi.id,
          name: poi.name,
          address: poi.address,
          location: [lng, lat],
          locationStr: poi.location,
          type: poi.type,
          businessArea: poi.business_area,
          city: poi.cityname,
          adcode: poi.adcode
        };
      });
      
      console.log(`城市POI搜索成功: ${city} -> ${pois.length}个地点`);
      return pois;
    } else {
      console.warn(`城市POI搜索未找到结果: ${city}`);
      return [];
    }
  }

  // 从旅行计划中提取关键地点经纬度
  parseKeyLocationsFromPlan(planText) {
    try {
      // 查找 --- 分隔符
      const separatorIndex = planText.indexOf('---');
      if (separatorIndex === -1) {
        console.warn('未找到关键地点经纬度信息分隔符');
        return [];
      }
      
      // 提取分隔符后的内容
      const keyLocationsSection = planText.substring(separatorIndex + 3).trim();
      
      // 查找JSON数组
      const jsonMatch = keyLocationsSection.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('未找到关键地点经纬度JSON数据');
        return [];
      }
      
      const jsonString = jsonMatch[0];
      const keyLocations = JSON.parse(jsonString);
      
      // 转换为需要的格式
      return keyLocations.map(loc => ({
        name: loc.name,
        location: Array.isArray(loc.location) 
          ? loc.location 
          : loc.location.replace(/[\[\]]/g, '').split(',').map(Number)
      })).filter(loc => loc.location.length === 2 && !isNaN(loc.location[0]) && !isNaN(loc.location[1]));
      
    } catch (error) {
      console.error('解析关键地点经纬度失败:', error);
      return [];
    }
  }

  // 从用户输入提取关键地点
  async extractKeyPlacesFromInput(userInput) {
    try {
      const data = await this.callAI([
        { role: 'system', content: extractKeyPlacesPrompt },
        { role: 'user', content: userInput }
      ], { temperature: 0.3, max_completion_tokens: 2000 });

      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content.trim();
        // 按行分割，过滤空行
        const places = content.split('\n')
          .map(place => place.trim())
          .filter(place => place && place !== '无明确地点');
        
        console.log('从输入提取到的关键地点:', places);
        return places;
      }
      return [];
    } catch (error) {
      console.warn('从输入提取关键地点失败，继续执行:', error);
      return [];
    }
  }

  // 关键字搜索地点（前10个）
  async keywordSearchPlaces(keyword, limit = 10) {
    const typesParam = '&types=风景名胜区|风景名胜|景点|历史遗迹|博物馆|公园广场|观景点|文化场馆|公园|寺庙|教堂|古迹|古建筑|世界遗产';
    const response = await fetch(`/amap/v3/place/text?keywords=${encodeURIComponent(keyword)}${typesParam}&offset=${limit}&page=1&key=${this.serviceKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === '1' && data.pois && data.pois.length > 0) {
      const pois = data.pois.map(poi => {
        const [lngStr, latStr] = poi.location.split(',');
        const lng = parseFloat(lngStr);
        const lat = parseFloat(latStr);
        
        return {
          id: poi.id,
          name: poi.name,
          address: poi.address,
          location: [lng, lat],
          locationStr: poi.location,
          type: poi.type,
          businessArea: poi.business_area,
          city: poi.cityname,
          adcode: poi.adcode
        };
      });
      
      console.log(`关键字搜索成功: ${keyword} -> ${pois.length}个地点`);
      return pois;
    } else {
      console.warn(`关键字搜索未找到结果: ${keyword}`);
      return [];
    }
  }

  // 从搜索结果中筛选最符合的地点
  async filterKeyPlaces(searchResults, userInput) {
    try {
      const data = await this.callAI([
        { role: 'system', content: filterKeyPlacesPrompt },
        { role: 'user', content: JSON.stringify({
          userOriginalInput: userInput,
          searchResults: searchResults.map(r => ({
            id: r.id,
            name: r.name,
            address: r.address,
            city: r.city
          }))
        })}
      ], { temperature: 0.3, max_completion_tokens: 2000 });
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content.trim();
        const selectedIds = content.split('\n')
          .map(id => id.trim())
          .filter(id => id);
        
        console.log('筛选出的地点ID:', selectedIds);
        
        // 根据ID查找对应的地点
        const selectedPlaces = searchResults.filter(r => selectedIds.includes(r.id));
        console.log('筛选出的地点:', selectedPlaces);
        
        return selectedPlaces;
      }
      return searchResults.slice(0, 6); // 返回前6个作为备选
    } catch (error) {
      console.warn('筛选地点失败，返回前6个:', error);
      return searchResults.slice(0, 6);
    }
  }

  // 根据POI ID查询POI详情
  async getPOIByID(poiId) {
    return await this.getPOIDetail(poiId);
  }

  // 验证地点一致性
  async validatePlaces(geocodeResults, planText, isCancelledCallback = () => false) {
    if (geocodeResults.length === 0) return [];
    
    try {
      // 检查是否已取消
      if (isCancelledCallback()) return [];
      
      const data = await this.callAI([
        { role: 'system', content: placeValidationPrompt },
        { role: 'user', content: JSON.stringify({
          userOriginalInput: planText,
          userPlan: planText,
          results: geocodeResults.map(r => ({
            originalPlace: r.originalPlace,
            originalCity: r.originalCity,
            originalType: r.originalType,
            foundPlace: r.foundPlace,
            foundAddress: r.foundAddress,
            foundLocation: r.foundLocation
          }))
        })}
      ], { temperature: 0.3, max_completion_tokens: 2000 });
      console.log('地点验证响应:', data);
      
      if (data.choices && data.choices.length > 0) {
        let content = data.choices[0].message.content.trim();
        try {
          // 清理markdown代码块标记
          if (content.startsWith('```json') || content.startsWith('```')) {
            content = content.replace(/^```json\s*/, '').replace(/^```\s*/, '');
          }
          if (content.endsWith('```')) {
            content = content.replace(/\s*```$/, '');
          }
          content = content.trim();
          
          console.log('清理后的验证响应:', content);
          
          // 尝试解析JSON响应
          const validationResult = JSON.parse(content);
          const keepIndices = validationResult.keep || [];
          const removeIndices = validationResult.remove || [];
          
          console.log('验证结果 - 保留:', keepIndices, '删除:', removeIndices);
          
          // 返回验证通过的地点
          return keepIndices.map(index => geocodeResults[index]).filter(Boolean);
        } catch (parseError) {
          console.warn('解析验证响应失败，保留所有地点:', parseError, '原始内容:', data.choices[0].message.content);
          return geocodeResults;
        }
      }
      return geocodeResults;
    } catch (error) {
      console.warn('地点验证失败，保留所有地点:', error);
      return geocodeResults;
    }
  }

  // 提取旅行计划中涉及的城市
  async extractCities(planText) {
    try {
      const data = await this.callAI([
        { role: 'system', content: cityExtractionPrompt },
        { role: 'user', content: planText }
      ], { temperature: 0.3, max_completion_tokens: 2000 });

      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content.trim();
        try {
          const result = JSON.parse(content);
          console.log('提取到的城市:', result.cities);
          return result.cities || [];
        } catch (parseError) {
          console.warn('解析城市响应失败:', parseError);
          return [];
        }
      }
      return [];
    } catch (error) {
      console.warn('提取城市失败，继续执行:', error);
      return [];
    }
  }

  // 解析旅行计划中的地点
  async parseTravelPlan(planText, isCancelledCallback = () => false) {
    // 检查是否已取消
    if (isCancelledCallback()) return [];
    
    // 先提取旅行计划中涉及的城市
    const cities = await this.extractCities(planText);
    
    // 直接调用大模型智能提取地点
    try {
      const data = await this.callAI([
        { role: 'system', content: placeExtractionPrompt },
        { role: 'user', content: `用户原始输入：${planText}\n\n涉及的城市：${cities.join('、')}\n\n请优先考虑用户原始输入，提取最重要的主要景点。` }
      ], { temperature: 0.6, max_completion_tokens: 2000 });

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
        
        // 解析地点，提取纯地点名称（用于地理编码）、城市和POI类型
        const parsedPlaces = limitedAIPlaces.map(fullPlace => {
          let displayName = fullPlace;
          let geocodeName = fullPlace;
          let city = '';
          let poiType = '';
          
          // 首先提取POI类型（如果有的话）
          let placeWithoutType = fullPlace;
          const typeMatch = fullPlace.match(/^(.+?)\|(.+)$/);
          if (typeMatch) {
            placeWithoutType = typeMatch[1].trim();
            poiType = typeMatch[2].trim();
            displayName = placeWithoutType; // 显示名称不需要包含类型
            geocodeName = placeWithoutType;
          }
          
          // 然后解析城市和地点名称
          // 首先尝试解析格式：城市 地点名称（空格分隔）
          const spaceMatch = placeWithoutType.match(/^(\S+?)\s+(.+)$/);
          if (spaceMatch) {
            city = spaceMatch[1].trim();
            geocodeName = spaceMatch[2].trim();
            displayName = geocodeName; // 显示名称只保留地点，不要城市
            console.log(`解析地点: ${fullPlace} -> 地点名称: ${geocodeName}, 城市: ${city}, 类型: ${poiType}`);
          } else {
            // 如果没有空格分隔，尝试解析格式：地点名称（城市名）
            const match = placeWithoutType.match(/^(.+?)[（(](.+?)[）)]$/);
            if (match) {
              geocodeName = match[1].trim();
              city = match[2].trim();
              displayName = geocodeName; // 显示名称只保留地点，不要城市
              console.log(`解析地点: ${fullPlace} -> 地点名称: ${geocodeName}, 城市: ${city}, 类型: ${poiType}`);
            }
          }
          
          return {
            displayName: displayName,
            geocodeName: geocodeName,
            city: city,
            poiType: poiType
          };
        });
        
        console.log('解析后的地点列表:', parsedPlaces);
        
        // 地理编码 - 收集完整信息用于验证
        const rawGeocodeResults = [];
        for (let i = 0; i < parsedPlaces.length; i++) {
          const placeObj = parsedPlaces[i];
          const place = placeObj.geocodeName;
          const city = placeObj.city;
          const poiType = placeObj.poiType;
          try {
            // 增加延迟，避免超过API调用限制（从300ms增加到600ms）
            await new Promise(resolve => setTimeout(resolve, i * 200));
            const geocode = await this.geocode(place, city, poiType);
            if (geocode && geocode.location) {
              console.log(`地理编码成功: ${place} (${city || '未指定城市'}, ${poiType || '默认类型'}) -> ${geocode.location}`);
              rawGeocodeResults.push({
                ...geocode,
                displayName: geocode.foundPlace || placeObj.displayName
              });
            } else {
              console.warn(`无法解析地点: ${place} - 地理编码返回null`);
            }
          } catch (error) {
            if (error.message.includes('CUQPS_HAS_EXCEEDED_THE_LIMIT')) {
              console.warn(`地点 ${place} 超过API调用限制，稍后重试`);
              // 尝试重试一次，增加更长的延迟（从2000ms增加到3000ms）
              await new Promise(resolve => setTimeout(resolve, 1000));
              try {
                const geocode = await this.geocode(place, city, poiType);
                if (geocode && geocode.location) {
                  console.log(`地理编码成功(重试): ${place} (${city || '未指定城市'}, ${poiType || '默认类型'}) -> ${geocode.location}`);
                  rawGeocodeResults.push({
                    ...geocode,
                    displayName: geocode.foundPlace || placeObj.displayName
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

        console.log('地理编码完成，开始验证地点一致性...');
        const validatedResults = await this.validatePlaces(rawGeocodeResults, planText, isCancelledCallback);
        console.log('验证通过的地点:', validatedResults);

        // 转换为最终格式
        const filteredPlaces = validatedResults.map(result => ({
          name: result.displayName,
          location: result.location
        })).filter(place => place !== null);

        console.log('最终返回的地点:', filteredPlaces);

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

  // 根据用户输入生成初步旅行计划
  async generatePreliminaryPlan(userInput) {
    try {
      const data = await this.callAI([
        { role: 'system', content: preliminaryPlanPrompt },
        { role: 'user', content: userInput }
      ], { temperature: 0.7, max_completion_tokens: 2000 });

      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content.trim();
        console.log('生成的初步旅行计划:', content);
        return content;
      }
      return userInput;
    } catch (error) {
      console.warn('生成初步旅行计划失败，继续执行:', error);
      return userInput;
    }
  }

  // 从初步旅行计划中提取地点和城市信息，如果没有输出则重试直到有输出
  async extractPlacesAndCitiesFromInput(userInput) {
    const maxRetries = 5; // 最多重试5次
    let retryCount = 0;
    let lastError = null;

    while (retryCount < maxRetries) {
      try {
        console.log(`第${retryCount + 1}次尝试提取地点和城市信息...`);
        
        // 随着重试次数增加，调整温度以提高输出多样性
        const temperature = Math.min(0.1 + retryCount * 0.2, 0.9); // 从0.1逐渐增加到0.9
        
        // 根据重试次数调整提示词，增加明确的指导
        let adjustedPrompt = extractPlacesCitiesPrompt;
        if (retryCount > 0) {
          adjustedPrompt = extractPlacesCitiesPrompt + "\n\n注意：请确保输出有效的JSON格式，并且包含至少1个地点信息。如果无法识别地点，请根据上下文推断可能的旅行地点。";
        }
        if (retryCount > 1) {
          adjustedPrompt = extractPlacesCitiesPrompt + "\n\n重要：请仔细分析用户输入，提取所有可能的旅行地点。即使不明确提到城市，也要根据常识推断城市信息。必须返回有效的JSON，不能为空。";
        }
        
        const data = await this.callAI([
          { role: 'system', content: adjustedPrompt },
          { role: 'user', content: userInput }
        ], { temperature: temperature, max_completion_tokens: 2000 });

        if (data.choices && data.choices.length > 0) {
          let content = data.choices[0].message.content.trim();
          console.log('大模型识别的城市信息原始输出:', content);
          
          // 检查是否为空输出或无效内容
          if (!content || content.length < 5 || content === '{}' || content === '{"places": []}' || content === '{"places":[]}' || content.includes('no places found') || content.includes('无法识别')) {
            console.log('模型输出为空或无效，准备重试...');
            retryCount++;
            // 重试前增加延迟，让模型有时间重新思考
            await new Promise(resolve => setTimeout(resolve, 800));
            continue;
          }
          
          try {
            // 清理markdown代码块标记
            if (content.startsWith('```json') || content.startsWith('```')) {
              content = content.replace(/^```json\s*/, '').replace(/^```\s*/, '');
            }
            if (content.endsWith('```')) {
              content = content.replace(/\s*```$/, '');
            }
            content = content.trim();
            
            // 尝试修复常见的JSON格式问题
            // 1. 处理可能的尾部逗号
            content = content.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            // 2. 确保字符串用双引号
            content = content.replace(/'/g, '"');
            
            const result = JSON.parse(content);
            
            // 验证结果是否有有效的地点
            if (!result.places || !Array.isArray(result.places) || result.places.length === 0) {
              console.log('解析出的地点列表为空，准备重试...');
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 800));
              continue;
            }
            
            // 验证每个地点都有place和city字段
            const validPlaces = result.places.filter(place => 
              place && place.place && place.city && 
              typeof place.place === 'string' && 
              typeof place.city === 'string' &&
              place.place.trim() !== '' && 
              place.city.trim() !== ''
            );
            
            if (validPlaces.length === 0) {
              console.log('所有地点数据无效，准备重试...');
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 800));
              continue;
            }
            
            // 如果有些地点无效，但至少有一个有效，使用有效的部分
            if (validPlaces.length < result.places.length) {
              console.log(`过滤无效地点: ${result.places.length} -> ${validPlaces.length}`);
              result.places = validPlaces;
            }
            
            console.log('从初步计划提取到的地点和城市:', result);
            return result;
          } catch (parseError) {
            console.warn('解析地点和城市信息失败:', parseError);
            console.warn('原始内容:', content);
            lastError = parseError;
            retryCount++;
            // 重试前增加延迟
            await new Promise(resolve => setTimeout(resolve, 800));
            continue;
          }
        } else {
          console.log('大模型没有返回有效choices，准备重试...');
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 800));
          continue;
        }
      } catch (error) {
        console.warn('提取地点和城市信息失败:', error);
        lastError = error;
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 800));
        continue;
      }
    }
    
    // 如果达到最大重试次数
    console.warn(`达到最大重试次数(${maxRetries})，提取地点和城市信息失败，最后错误:`, lastError);
    return { places: [] };
  }

  // 验证城市名，返回该城市的POI（不限制类型）
  async verifyCity(cityName, limit = 5) {
    const cityParam = cityName ? `&city=${encodeURIComponent(cityName)}` : '';
    const response = await fetch(`/amap/v3/place/text?keywords=${encodeURIComponent(cityName)}${cityParam}&offset=${limit}&page=1&key=${this.serviceKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === '1' && data.pois && data.pois.length > 0) {
      const pois = data.pois.map(poi => {
        const [lngStr, latStr] = poi.location.split(',');
        const lng = parseFloat(lngStr);
        const lat = parseFloat(latStr);
        
        return {
          id: poi.id,
          name: poi.name,
          address: poi.address,
          location: [lng, lat],
          locationStr: poi.location,
          type: poi.type,
          businessArea: poi.business_area,
          city: poi.cityname,
          adcode: poi.adcode
        };
      });
      
      console.log(`城市验证成功: ${cityName} -> ${pois.length}个地点`);
      return pois;
    } else {
      console.warn(`城市验证未找到结果: ${cityName}`);
      return [];
    }
  }

  // 在指定城市下进行关键字搜索
  async keywordSearchInCity(keyword, city, limit = 10) {
    const typesParam = '&types=风景名胜区|风景名胜|景点|历史遗迹|博物馆|公园广场|观景点|文化场馆|公园|寺庙|教堂|古迹|古建筑|世界遗产';
    const cityParam = city ? `&city=${encodeURIComponent(city)}` : '';
    const response = await fetch(`/amap/v3/place/text?keywords=${encodeURIComponent(keyword)}${cityParam}${typesParam}&offset=${limit}&page=1&key=${this.serviceKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === '1' && data.pois && data.pois.length > 0) {
      const pois = data.pois.map(poi => {
        const [lngStr, latStr] = poi.location.split(',');
        const lng = parseFloat(lngStr);
        const lat = parseFloat(latStr);
        
        return {
          id: poi.id,
          name: poi.name,
          address: poi.address,
          location: [lng, lat],
          locationStr: poi.location,
          type: poi.type,
          businessArea: poi.business_area,
          city: poi.cityname,
          adcode: poi.adcode
        };
      });
      
      console.log(`城市内关键字搜索成功: ${keyword} (${city}) -> ${pois.length}个地点`);
      return pois;
    } else {
      console.warn(`城市内关键字搜索未找到结果: ${keyword} (${city})`);
      return [];
    }
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