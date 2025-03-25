<template>
  <div class="cesium-tools">
    <div class="tool-group">
      <h3>图层控制</h3>
      <div class="layer-controls">
        <label>
          <input 
            type="radio" 
            name="baseLayer" 
            value="normal" 
            v-model="currentLayer"
            @change="handleLayerChange"
          >
          标准底图
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
      <button @click="startMeasure('distance')" :class="{ active: measuring === 'distance' }">
        测距
      </button>
      <button @click="startMeasure('area')" :class="{ active: measuring === 'area' }">
        测面
      </button>
      <button @click="clearMeasurements" v-if="measuring">
        清除测量
      </button>
      <div class="measure-tip" v-if="measuring">
        {{ measureTip }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  map: {
    type: Object,
    required: true
  },
  AMap: {
    type: Object,
    required: true
  }
});

const measuring = ref('');
const currentLayer = ref('normal');
const mouseTool = shallowRef(null);
const overlays = ref([]);

const measureTip = computed(() => {
  if (!measuring.value) return '';
  return measuring.value === 'distance' 
    ? '点击地图开始测距，双击结束' 
    : '点击地图绘制多边形，双击结束绘制';
});

// 图层控制
const handleLayerChange = () => {
  if (currentLayer.value === 'normal') {
    props.map.setLayers([new props.AMap.TileLayer()]);
  } else {
    props.map.setLayers([new props.AMap.TileLayer.Satellite()]);
  }
};

// 地图控制方法
const zoomIn = () => {
  props.map.zoomIn();
};

const zoomOut = () => {
  props.map.zoomOut();
};

const resetView = () => {
  props.map.setZoomAndCenter(11, [116.397428, 39.90923]);
};

onMounted(() => {
  try {
    // 初始化鼠标工具
    mouseTool.value = new props.AMap.MouseTool(props.map);

    // 监听测量事件
    mouseTool.value.on('draw', function(event) {
      if (event.type === 'end') {  // 只在绘制结束时处理
        const { obj } = event;
        overlays.value = [...overlays.value, obj];

        if (measuring.value === 'distance') {
          // 获取路径长度
          const path = obj.getPath();
          const distance = props.AMap.GeometryUtil.distanceOfLine(path);
          const text = formatDistance(distance);
          const center = path[Math.floor(path.length / 2)];
          addLabel(center, text);
        } else if (measuring.value === 'area') {
          // 获取面积
          const path = obj.getPath();
          const area = props.AMap.GeometryUtil.ringArea(path);
          const text = formatArea(area);
          const center = props.AMap.GeometryUtil.ringCentroid(path);
          addLabel(center, text);
        }

        // 绘制完成后关闭绘制工具
        mouseTool.value.close();
        measuring.value = '';
      }
    });
  } catch (error) {
    console.error('初始化测量工具时发生错误:', error);
  }
});

onUnmounted(() => {
  if (mouseTool.value) {
    mouseTool.value.close();
  }
  clearMeasurements();
});

// 测量功能
const startMeasure = (type) => {
  try {
    if (measuring.value === type) {
      measuring.value = '';
      mouseTool.value.close();
      return;
    }

    // 先清除之前的测量
    clearMeasurements();
    measuring.value = type;
    
    if (type === 'distance') {
      mouseTool.value.polyline({
        strokeColor: '#0084ff',
        strokeOpacity: 1,
        strokeWeight: 2,
        strokeStyle: 'solid',
        lineJoin: 'round',
        lineCap: 'round',
        showDirection: true,
        isOutline: true,
        outlineColor: '#fff',
        outlineWidth: 1,
        autoClose: false
      });
    } else {
      mouseTool.value.polygon({
        strokeColor: '#0084ff',
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: '#0084ff',
        fillOpacity: 0.3,
        strokeStyle: 'solid',
        autoClose: true,
        extData: {
          type: 'measure_area'
        }
      });
    }
  } catch (error) {
    console.error('开始测量时发生错误:', error);
    measuring.value = '';
  }
};

const clearMeasurements = () => {
  try {
    measuring.value = '';
    mouseTool.value?.close();
    
    // 清除所有覆盖物
    if (overlays.value.length > 0) {
      // 从地图上移除所有覆盖物
      props.map.remove(overlays.value);
      // 清空数组
      overlays.value = [];
    }
  } catch (error) {
    console.error('清除测量时发生错误:', error);
  }
};

const addLabel = (position, text) => {
  try {
    const label = new props.AMap.Text({
      text: text,
      position: position,
      style: {
        'background-color': 'rgba(0,0,0,0.7)',
        'border-width': 0,
        'text-align': 'center',
        'font-size': '14px',
        'color': 'white',
        'padding': '5px 10px',
        'border-radius': '3px'
      }
    });

    props.map.add(label);
    overlays.value = [...overlays.value, label];
  } catch (error) {
    console.error('添加标注时发生错误:', error);
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

.measure-tip {
  margin-top: 8px;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style> 