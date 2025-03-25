<template>
  <div class="cesium-container">
    <div id="cesiumContainer" ref="viewerContainer"></div>
    <CesiumTools 
      v-if="viewer"
      :viewer="viewer"
      @measure-start="startMeasure"
      @measure-clear="clearMeasure"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as Cesium from 'cesium';
import CesiumTools from '../components/CesiumTools.vue';
import { MeasureTool } from '../utils/measure';

const viewerContainer = ref(null);
const viewer = ref(null);
const measureTool = ref(null);

// 初始化 Cesium 查看器
const initViewer = () => {

  viewer.value = new Cesium.Viewer(viewerContainer.value, {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    navigationInstructionsInitiallyVisible: false
  });

  // 设置默认视角为中国
  viewer.value.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.397428, 39.90923, 5000000.0)
  });

  // 初始化测量工具
  measureTool.value = new MeasureTool(viewer.value);
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
  }
};

onMounted(() => {
  initViewer();
});

onUnmounted(() => {
  if (viewer.value) {
    viewer.value.destroy();
    viewer.value = null;
  }
  if (measureTool.value) {
    measureTool.value.clear();
  }
});
</script>

<style scoped>
.cesium-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

#cesiumContainer {
  width: 100%;
  height: 100%;
}
</style> 