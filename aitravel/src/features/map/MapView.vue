<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import amapService from './amap.service'

const props = defineProps({
  center: {
    type: Array,
    default: () => [116.397428, 39.90923] // 默认北京
  },
  zoom: {
    type: Number,
    default: 11
  },
  style: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['map-loaded', 'map-error'])

const mapContainer = ref(null)
let mapInstance = null

onMounted(async () => {
  try {
    // 初始化地图
    mapInstance = await amapService.initMap(mapContainer.value, {
      center: props.center,
      zoom: props.zoom
    })
    
    // 触发地图加载成功事件
    emit('map-loaded', mapInstance)
  } catch (error) {
    console.error('地图加载失败:', error)
    emit('map-error', error)
  }
})

onUnmounted(() => {
  // 清理地图实例
  if (mapInstance) {
    amapService.destroy()
    mapInstance = null
  }
})

// 监听属性变化
watch(
  () => props.center,
  (newCenter) => {
    if (mapInstance) {
      amapService.setCenter(newCenter[0], newCenter[1])
    }
  }
)

watch(
  () => props.zoom,
  (newZoom) => {
    if (mapInstance) {
      amapService.setZoom(newZoom)
    }
  }
)

// 暴露方法给父组件
defineExpose({
  getMap: () => mapInstance,
  addMarker: (position, options) => {
    if (mapInstance) {
      return amapService.addMarker(position, options)
    }
    return null
  }
})
</script>

<template>
  <div 
    ref="mapContainer" 
    class="map-container"
    :style="style"
  ></div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: var(--radius-md);
  overflow: hidden;
}
</style>