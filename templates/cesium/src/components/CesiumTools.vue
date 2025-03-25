<template>
  <div class="cesium-tools">
    <div class="tool-group">
      <h3>图层控制</h3>
      <div class="layer-controls">
        <label>
          <input 
            type="radio" 
            name="baseLayer" 
            value="osm" 
            v-model="currentLayer"
            @change="handleLayerChange"
          >
          影像底图
        </label>
        <label>
          <input 
            type="radio" 
            name="baseLayer" 
            value="terrain" 
            v-model="currentLayer"
            @change="handleLayerChange"
          >
          地形图
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
      <button @click="startMeasure('distance')" :class="{ active: measuring === 'distance' }">
        测距
      </button>
      <button @click="startMeasure('area')" :class="{ active: measuring === 'area' }">
        测面
      </button>
      <button @click="clearMeasure" v-if="measuring">
        清除测量
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import * as Cesium from 'cesium';

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['measure-start', 'measure-clear']);

const measuring = ref('');
const currentLayer = ref('osm');

// 图层控制
const handleLayerChange = () => {
  const imageryLayers = props.viewer.imageryLayers;
  imageryLayers.removeAll();

  if (currentLayer.value === 'osm') {
    imageryLayers.addImageryProvider(
      new Cesium.IonImageryProvider({ assetId: 3 })
    );
  } else {
    imageryLayers.addImageryProvider(
      new Cesium.IonImageryProvider({ assetId: 4 })
    );
  }
};

// 地图控制方法
const zoomIn = () => {
  const camera = props.viewer.camera;
  const height = camera.positionCartographic.height;
  camera.zoomIn(height * 0.5);
};

const zoomOut = () => {
  const camera = props.viewer.camera;
  const height = camera.positionCartographic.height;
  camera.zoomOut(height * 0.5);
};

const resetView = () => {
  props.viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.397428, 39.90923, 5000000.0)
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
</script>

<style scoped>
.cesium-tools {
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