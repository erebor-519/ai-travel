// 高德地图服务
class AMapService {
  constructor() {
    this.map = null;
    this.loaded = false;
    this.loadPromise = null;
    this.apiKey = '2d2b4eba69cd250f810caedccec09db1';
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
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${this.apiKey}`;
      script.async = true;
      script.defer = true;

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
    this.loaded = false;
    this.loadPromise = null;
  }
}

// 导出单例
const amapService = new AMapService();
export default amapService;