import requests
import json
import os
from dotenv import load_dotenv

# 加载.env文件
load_dotenv()

def verify_city(city_name, limit=5):
    """验证城市名（不限制类型）"""
    url = "https://restapi.amap.com/v3/place/text"
    
    params = {
        "keywords": city_name,
        "city": city_name,
        "offset": str(limit),
        "page": "1",
        "key": os.getenv('VITE_AMAP_SERVICE_KEY', '2ca47c5535532f4bb5134dc7af4dcb92')
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        print(f"\n{'='*60}")
        print(f"验证城市: {city_name}")
        print(f"{'='*60}")
        
        if data.get('status') == '1' and data.get('pois'):
            pois = data['pois']
            print(f"\n找到 {len(pois)} 个POI\n")
            
            for i, poi in enumerate(pois, 1):
                print(f"POI #{i}:")
                print(f"  名称: {poi.get('name', '')}")
                print(f"  地址: {poi.get('address', '')}")
                print(f"  cityname: {poi.get('cityname', '')}")
                print(f"  pname: {poi.get('pname', '')}")
                print(f"  adname: {poi.get('adname', '')}")
                print(f"  location: {poi.get('location', '')}")
                print()
            
            if pois:
                first_poi = pois[0]
                gaode_city = first_poi.get('cityname', '')
                print(f"\n第一个POI的cityname: {gaode_city}")
                print(f"结果: 原始城市 '{city_name}' -> 高德城市 '{gaode_city}'")
            
            return pois
        else:
            print(f"\n未找到POI!")
            print(f"响应数据: {json.dumps(data, ensure_ascii=False, indent=2)}")
            return []
            
    except requests.exceptions.RequestException as e:
        print(f"\n请求失败: {e}")
        return []

if __name__ == "__main__":
    # 测试各种城市
    verify_city("台南")
    verify_city("台北")
    verify_city("北京")
    verify_city("上海")
    verify_city("杭州")
