<template>
  <div class="map-tools">
    <div class="tool-group">
      <h3>底图切换</h3>
      <div class="layer-controls">
        <label>
          <input 
            type="radio" 
            name="baseLayer" 
            value="osm" 
            v-model="currentLayer"
            @change="handleLayerChange"
          >
          OpenStreetMap
        </label>
        <label>
          <input 
            type="radio" 
            name="baseLayer" 
            value="satellite" 
            v-model="currentLayer"
            @change="handleLayerChange"
          >
          卫星影像
        </label>
      </div>
    </div>

    <div class="tool-group">
      <h3>地图控制</h3>
      <button @click="zoomIn">放大</button>
      <button @click="zoomOut">缩小</button>
      <button @click="resetView">重置视图</button>
    </div>
    
    <div class="tool-group">
      <h3>测量工具</h3>
      <button @click="startMeasure('LineString')" :class="{ active: measuring === 'LineString' }">
        测距
      </button>
      <button @click="startMeasure('Polygon')" :class="{ active: measuring === 'Polygon' }">
        测面
      </button>
      <button @click="clearMeasure" v-if="measuring">
        清除测量
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';

const props = defineProps({
  map: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['measure-start', 'measure-clear']);

const measuring = ref('');
const currentLayer = ref('osm');

// 图层实例
const osmLayer = new TileLayer({
  source: new OSM(),
  zIndex: 0
});

const satelliteLayer = new TileLayer({
  source: new XYZ({
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19
  }),
  zIndex: 0
});

// 图层控制
const handleLayerChange = () => {
  // 移除所有底图图层
  const layers = props.map.getLayers();
  layers.forEach(layer => {
    if (layer === osmLayer || layer === satelliteLayer) {
      props.map.removeLayer(layer);
    }
  });

  // 添加选中的图层
  if (currentLayer.value === 'osm') {
    props.map.addLayer(osmLayer);
  } else if (currentLayer.value === 'satellite') {
    props.map.addLayer(satelliteLayer);
  }
};

// 地图控制方法
const zoomIn = () => {
  const view = props.map.getView();
  const zoom = view.getZoom();
  view.animate({
    zoom: zoom + 1,
    duration: 250
  });
};

const zoomOut = () => {
  const view = props.map.getView();
  const zoom = view.getZoom();
  view.animate({
    zoom: zoom - 1,
    duration: 250
  });
};

const resetView = () => {
  const view = props.map.getView();
  view.animate({
    center: fromLonLat([116.397428, 39.90923]),
    zoom: 12,
    duration: 250
  });
};

// 测量工具
const startMeasure = (type) => {
  measuring.value = type;
  emit('measure-start', type);
};

const clearMeasure = () => {
  measuring.value = '';
  emit('measure-clear');
};

// 初始化默认图层
onMounted(() => {
  handleLayerChange();
});
</script>

<style scoped>
.map-tools {
  position: absolute;
  left: 10px;
  top: 10px;
  background: white;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
}

.tool-group {
  margin-bottom: 15px;
}

.tool-group:last-child {
  margin-bottom: 0;
}

h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
}

.layer-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

input[type="radio"] {
  margin: 0;
  cursor: pointer;
}

button {
  display: inline-block;
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

button:hover {
  background: #45a049;
}

button.active {
  background: #2196F3;
}

button.active:hover {
  background: #1976D2;
}
</style> 