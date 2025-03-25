<template>
  <div class="map-container">
    <div id="container"></div>
    <MapTools v-if="map" :map="map" :AMap="AMapClass" />
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import AMapLoader from '@amap/amap-jsapi-loader';
import MapTools from '../components/MapTools.vue';

// 使用 shallowRef 避免 Vue 的响应式系统深度代理地图对象
const map = shallowRef(null);
const AMapClass = shallowRef(null);

onMounted(async () => {
  try {
    // 加载高德地图
    AMapClass.value = await AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY,  // 从环境变量获取 key
      version: '2.0',
      plugins: [
        'AMap.Scale',
        'AMap.ToolBar',
        'AMap.MouseTool',
        'AMap.PlaceSearch',
        'AMap.Geocoder'
      ]
    });

    // 创建地图实例
    map.value = new AMapClass.value.Map('container', {
      zoom: 11,
      center: [116.397428, 39.90923], // 北京市中心
      viewMode: '2D',
      mapStyle: 'amap://styles/normal'
    });

    // 添加比例尺控件
    map.value.addControl(new AMapClass.value.Scale());

  } catch (error) {
    console.error('初始化地图时发生错误:', error);
  }
});

onUnmounted(() => {
  if (map.value) {
    map.value.destroy();
  }
});
</script>

<style>
.map-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

#container {
  padding: 0;
  margin: 0;
  height: 100%;
  width: 100%;
}

/* 覆盖高德地图默认样式 */
.amap-logo {
  display: none !important;
}

.amap-copyright {
  display: none !important;
}
</style> 