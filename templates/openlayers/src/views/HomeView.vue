<template>
  <div class="map-container">
    <div id="map" ref="mapRef"></div>
    <MapTools 
      v-if="map"
      :map="map" 
      @measure-start="startMeasure"
      @measure-clear="clearMeasure"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import MapTools from '../components/MapTools.vue';
import { MeasureTool } from '../utils/measure';

const mapRef = ref(null);
const map = ref(null);
const measureTool = ref(null);

// 初始化地图
const initMap = () => {
  map.value = new Map({
    target: mapRef.value,
    view: new View({
      center: fromLonLat([116.397428, 39.90923]), // 北京坐标
      zoom: 12
    })
  });

  // 初始化测量工具
  measureTool.value = new MeasureTool(map.value);
};

// 测量工具处理方法
const startMeasure = (type) => {
  if (measureTool.value) {
    measureTool.value.startMeasure(type);
  }
};

const clearMeasure = () => {
  if (measureTool.value) {
    measureTool.value.clear();
    // 移除测量交互
    measureTool.value.removeInteraction();
  }
};

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  if (map.value) {
    map.value.setTarget(null);
  }
  if (measureTool.value) {
    measureTool.value.clear();
  }
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

#map {
  width: 100%;
  height: 100%;
}
</style> 