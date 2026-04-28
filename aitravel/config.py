import os
from dotenv import load_dotenv

# 加载.env文件
load_dotenv()

# 高德地图API配置
AMAP_SERVICE_KEY = os.getenv('VITE_AMAP_SERVICE_KEY', '2ca47c5535532f4bb5134dc7af4dcb92')