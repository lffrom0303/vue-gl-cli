<template>
  <div class="home">
    <div id="map" ref="mapRef"></div>
    <div class="map-controls">
      <button @click="zoomIn">放大</button>
      <button @click="zoomOut">缩小</button>
      <button @click="resetView">重置视图</button>
    </div>
    <MapTools 
      :map="map" 
      @measure-start="handleMeasureStart"
      @measure-clear="handleMeasureClear"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import MapTools from '../components/MapTools.vue';
import { MeasureTool } from '../utils/measure';

const mapRef = ref(null);
let map = null;
let measureTool = null;

// 初始化地图
const initMap = () => {
  map = new Map({
    target: mapRef.value,
    layers: [
      new TileLayer({
        source: new OSM()
      })
    ],
    view: new View({
      center: fromLonLat([116.397428, 39.90923]), // 北京坐标
      zoom: 12
    })
  });

  // 初始化测量工具
  measureTool = new MeasureTool(map);
};

// 地图控制方法
const zoomIn = () => {
  const view = map.getView();
  const zoom = view.getZoom();
  view.animate({
    zoom: zoom + 1,
    duration: 250
  });
};

const zoomOut = () => {
  const view = map.getView();
  const zoom = view.getZoom();
  view.animate({
    zoom: zoom - 1,
    duration: 250
  });
};

const resetView = () => {
  const view = map.getView();
  view.animate({
    center: fromLonLat([116.397428, 39.90923]),
    zoom: 12,
    duration: 250
  });
};

// 测量工具处理方法
const handleMeasureStart = (type) => {
  if (measureTool) {
    measureTool.startMeasure(type);
  }
};

const handleMeasureClear = () => {
  if (measureTool) {
    measureTool.clear();
  }
};

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  if (measureTool) {
    measureTool.clear();
  }
  if (map) {
    map.setTarget(null);
    map = null;
  }
});
</script>

<style scoped>
.home {
  width: 100%;
  height: 100%;
  position: relative;
}

#map {
  width: 100%;
  height: calc(100vh - 90px);
}

.map-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.map-controls button {
  display: block;
  width: 100%;
  margin: 5px 0;
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.map-controls button:hover {
  background: #45a049;
}
</style> 