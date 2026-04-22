import requests
import json

def test_amap_city_search(city_name, keyword="景点"):
    """测试高德地图城市POI搜索"""
    url = "https://restapi.amap.com/v3/place/text"
    
    params = {
        "keywords": keyword,
        "city": city_name,
        "types": "风景名胜区|风景名胜|景点|历史遗迹|博物馆|公园广场|观景点|文化场馆|公园|寺庙|教堂|古迹|古建筑|世界遗产",
        "offset": "10",  # 只返回前10个结果
        "page": "1",
        "key": "2ca47c5535532f4bb5134dc7af4dcb92"
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        print(f"\n{'='*60}")
        print(f"测试城市: {city_name}, 关键词: {keyword}")
        print(f"{'='*60}")
        
        if data.get('status') == '1' and data.get('pois'):
            pois = data['pois']
            print(f"\n找到 {len(pois)} 个POI\n")
            
            # 显示前3个POI的详细信息
            for i, poi in enumerate(pois[:3], 1):
                print(f"POI #{i}:")
                print(f"  名称: {poi.get('name', '')}")
                print(f"  地址: {poi.get('address', '')}")
                print(f"  cityname: {poi.get('cityname', '')}")
                print(f"  city: {poi.get('city', '')}")
                print(f"  pname: {poi.get('pname', '')}")
                print(f"  adname: {poi.get('adname', '')}")
                print(f"  location: {poi.get('location', '')}")
                print()
            
            # 统计所有POI的cityname
            citynames = set()
            for poi in pois:
                cn = poi.get('cityname', '')
                if cn:
                    citynames.add(cn)
            
            print(f"\n所有POI的cityname值: {sorted(citynames)}")
            
            if pois:
                first_poi = pois[0]
                print(f"\n第一个POI的cityname: {first_poi.get('cityname', '')}")
            
            return pois
        else:
            print(f"\n未找到POI!")
            print(f"响应数据: {json.dumps(data, ensure_ascii=False, indent=2)}")
            return []
            
    except requests.exceptions.RequestException as e:
        print(f"\n请求失败: {e}")
        return []

def test_geocode(address):
    """测试地理编码"""
    url = "https://restapi.amap.com/v3/geocode/geo"
    
    params = {
        "address": address,
        "key": "2ca47c5535532f4bb5134dc7af4dcb92"
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        print(f"\n{'='*60}")
        print(f"地理编码测试: {address}")
        print(f"{'='*60}")
        
        if data.get('status') == '1' and data.get('geocodes'):
            geocodes = data['geocodes']
            print(f"\n找到 {len(geocodes)} 个结果\n")
            
            for i, gc in enumerate(geocodes, 1):
                print(f"结果 #{i}:")
                print(f"  格式化地址: {gc.get('formatted_address', '')}")
                print(f"  country: {gc.get('country', '')}")
                print(f"  province: {gc.get('province', '')}")
                print(f"  city: {gc.get('city', '')}")
                print(f"  district: {gc.get('district', '')}")
                print(f"  location: {gc.get('location', '')}")
                print(f"  adcode: {gc.get('adcode', '')}")
                print()
            
            return geocodes
        else:
            print(f"\n未找到结果!")
            print(f"响应数据: {json.dumps(data, ensure_ascii=False, indent=2)}")
            return []
            
    except requests.exceptions.RequestException as e:
        print(f"\n请求失败: {e}")
        return []

if __name__ == "__main__":
    # 测试各种台南相关的搜索
    print("="*60)
    print("测试1: 关键词='景点', city='台南'")
    test_amap_city_search("台南", "景点")
    
    print("\n" + "="*60)
    print("测试2: 关键词='景点', city='台南市'")
    test_amap_city_search("台南市", "景点")
    
    print("\n" + "="*60)
    print("测试3: 关键词='台南', city='' (不限制城市)")
    test_amap_city_search("", "台南")
    
    print("\n" + "="*60)
    print("测试4: 地理编码 '台南市'")
    test_geocode("台南市")
    
    print("\n" + "="*60)
    print("测试5: 地理编码 '台湾台南市'")
    test_geocode("台湾台南市")
    
    print("\n" + "="*60)
    print("测试6: 关键词='台北', city=''")
    test_amap_city_search("", "台北")
