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
      <button @click="clearMeasurements" v-if="measuring">
        清除测量
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import Basemap from "@arcgis/core/Basemap";
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';

const props = defineProps({
  view: {
    type: Object,
    required: true
  }
});

const measuring = ref('');
const currentLayer = ref('osm');
const sketchLayer = shallowRef(null);
const measureLayer = shallowRef(null);
const sketchViewModel = shallowRef(null);

// 图层控制
const handleLayerChange = () => {
  const map = props.view.map;
  if (currentLayer.value === 'osm') {
    map.basemap = Basemap.fromId("satellite");
  } else {
    map.basemap = Basemap.fromId("topo-vector");
  }
};

// 地图控制方法
const zoomIn = () => {
  const zoom = props.view.zoom;
  props.view.zoom = zoom + 1;
};

const zoomOut = () => {
  const zoom = props.view.zoom;
  props.view.zoom = zoom - 1;
};

const resetView = () => {
  props.view.goTo({
    center: [116.397428, 39.90923],
    zoom: 11
  });
};

onMounted(() => {
  try {
    // 创建图层
    sketchLayer.value = new GraphicsLayer();
    measureLayer.value = new GraphicsLayer();
    props.view.map.addMany([sketchLayer.value, measureLayer.value]);

    // 设置绘图样式
    const lineSymbol = new SimpleLineSymbol({
      color: [0, 132, 255, 1],
      width: 2,
      style: 'solid'
    });

    const fillSymbol = new SimpleFillSymbol({
      color: [0, 132, 255, 0.3],
      outline: {
        color: [0, 132, 255, 1],
        width: 2
      }
    });

    // 初始化绘图工具
    sketchViewModel.value = new SketchViewModel({
      view: props.view,
      layer: sketchLayer.value,
      defaultCreateOptions: {
        mode: 'click',
        hasZ: false
      },
      defaultUpdateOptions: {
        enableZ: false,
        multipleSelectionEnabled: false,
        toggleToolOnClick: false
      },
      polylineSymbol: lineSymbol,
      polygonSymbol: fillSymbol
    });

    // 监听绘图事件
    sketchViewModel.value.on(['create', 'update'], (event) => {
      let result;
      const geometry = event.graphic.geometry;

      if (event.state === 'start' || event.state === 'active') {
        // 清除之前的临时测量结果
        measureLayer.value.graphics.forEach(graphic => {
          if (graphic.temp) {
            measureLayer.value.remove(graphic);
          }
        });

        if (geometry) {
          // 确保图形使用正确的符号
          event.graphic.symbol = measuring.value === 'distance' ? lineSymbol : fillSymbol;
          
          if (measuring.value === 'distance') {
            result = formatDistance(geometryEngine.geodesicLength(geometry, 'meters'));
          } else if (measuring.value === 'area') {
            result = formatArea(geometryEngine.geodesicArea(geometry, 'square-meters'));
          }

          if (result) {
            const point = geometry.type === 'polyline' ? geometry.extent.center : geometry.centroid;
            addMeasurementLabel(point, result, true);
          }
        }
      }

      if (event.state === 'complete') {
        // 清除临时标签
        measureLayer.value.graphics.forEach(graphic => {
          if (graphic.temp) {
            measureLayer.value.remove(graphic);
          }
        });

        // 确保最终图形使用正确的符号
        event.graphic.symbol = measuring.value === 'distance' ? lineSymbol : fillSymbol;

        if (measuring.value === 'distance') {
          const distance = geometryEngine.geodesicLength(geometry, 'meters');
          addMeasurementLabel(geometry.extent.center, formatDistance(distance));
        } else if (measuring.value === 'area') {
          const area = geometryEngine.geodesicArea(geometry, 'square-meters');
          addMeasurementLabel(geometry.centroid, formatArea(area));
        }
      }
    });
  } catch (error) {
    console.error('初始化测量工具时发生错误:', error);
  }
});

onUnmounted(() => {
  try {
    if (sketchViewModel.value) {
      sketchViewModel.value.destroy();
    }
    if (props.view && props.view.map) {
      props.view.map.remove(sketchLayer.value);
      props.view.map.remove(measureLayer.value);
    }
  } catch (error) {
    console.error('清理测量工具时发生错误:', error);
  }
});

// 测量功能
const startMeasure = (type) => {
  try {
    if (measuring.value === type) {
      measuring.value = '';
      sketchViewModel.value.cancel();
      return;
    }

    measuring.value = type;
    const tool = type === 'distance' ? 'polyline' : 'polygon';
    
    // 重新创建绘图工具
    sketchViewModel.value.create(tool, {
      mode: 'click',
      hasZ: false
    });
  } catch (error) {
    console.error('开始测量时发生错误:', error);
    measuring.value = '';
  }
};

const clearMeasurements = () => {
  try {
    measuring.value = '';
    sketchViewModel.value.cancel();
    sketchLayer.value.removeAll();
    measureLayer.value.removeAll();
  } catch (error) {
    console.error('清除测量时发生错误:', error);
  }
};

const addMeasurementLabel = (point, text, isTemp = false) => {
  try {
    const textSymbol = new TextSymbol({
      color: 'white',
      haloColor: 'black',
      haloSize: 1,
      text: text,
      font: {
        size: 14,
        weight: 'bold',
        family: 'sans-serif'
      },
      horizontalAlignment: 'center',
      verticalAlignment: 'middle'
    });

    const graphic = {
      geometry: point,
      symbol: textSymbol,
      temp: isTemp
    };

    measureLayer.value.add(graphic);
  } catch (error) {
    console.error('添加测量标注时发生错误:', error);
  }
};

const formatDistance = (meters) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} 公里`;
  }
  return `${meters.toFixed(2)} 米`;
};

const formatArea = (squareMeters) => {
  if (squareMeters >= 1000000) {
    return `${(squareMeters / 1000000).toFixed(2)} 平方公里`;
  }
  return `${squareMeters.toFixed(2)} 平方米`;
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