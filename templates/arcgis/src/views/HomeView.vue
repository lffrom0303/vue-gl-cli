<template>
  <div class="map-container">
    <div id="viewDiv"></div>
    <MapTools v-if="mapView" :view="mapView" />
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import MapTools from '../components/MapTools.vue';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import esriConfig from '@arcgis/core/config';

// 导入 ArcGIS CSS
import '@arcgis/core/assets/esri/themes/light/main.css';

// 使用 shallowRef 来避免 Vue 的响应式系统深度代理 ArcGIS 对象
const mapView = shallowRef(null);
const map = shallowRef(null);

onMounted(async () => {
  try {
    // 配置 ArcGIS API
    esriConfig.assetsPath = './assets';

    // 创建地图实例
    map.value = new Map({
      basemap: 'satellite'  // 默认使用卫星影像
    });

    // 创建地图视图
    mapView.value = new MapView({
      container: 'viewDiv',
      map: map.value,
      zoom: 11,
      center: [116.397428, 39.90923], // 北京市中心
      ui: {
        components: ['zoom'] // 只保留缩放控件
      }
    });

    // 等待视图加载完成
    await mapView.value.when();

  } catch (error) {
    console.error('初始化地图时发生错误:', error);
  }
});

onUnmounted(() => {
  if (mapView.value) {
    try {
      mapView.value.destroy();
    } catch (error) {
      console.error('销毁地图时发生错误:', error);
    }
  }
});
</script>

<style>
.map-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

#viewDiv {
  padding: 0;
  margin: 0;
  height: 100%;
  width: 100%;
}

/* 覆盖 ArcGIS API 默认样式 */
.esri-view {
  height: 100%;
  width: 100%;
}

.esri-view-surface {
  outline: none;
}

.esri-popup {
  min-width: 250px;
}

.esri-widget {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style> 