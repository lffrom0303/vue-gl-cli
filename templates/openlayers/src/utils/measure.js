import { unByKey } from 'ol/Observable';
import { getArea, getLength } from 'ol/sphere';
import { Draw } from 'ol/interaction';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { LineString, Polygon } from 'ol/geom';
import Overlay from 'ol/Overlay';

export class MeasureTool {
  constructor(map) {
    this.map = map;
    this.source = new VectorSource();
    this.vector = new VectorLayer({
      source: this.source,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new Stroke({
          color: '#ffcc33',
          width: 2
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#ffcc33'
          })
        })
      }),
      zIndex: 1
    });

    this.map.addLayer(this.vector);
    this.draw = null;
    this.listener = null;
    this.helpTooltipElement = null;
    this.measureTooltipElement = null;
    this.measureTooltip = null;
    this.sketch = null;
    this.helpTooltip = null;
    this.measureTooltips = []; // 存储所有测量提示
  }

  startMeasure(type) {
    // 清除之前的测量
    this.clear();

    // 创建绘制样式
    const drawStyle = new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new Stroke({
        color: '#ffcc33',
        lineDash: [10, 10],
        width: 2
      }),
      image: new CircleStyle({
        radius: 5,
        stroke: new Stroke({
          color: '#ffcc33'
        }),
        fill: new Fill({
          color: '#ffcc33'
        })
      })
    });

    // 创建绘制交互
    this.draw = new Draw({
      source: this.source,
      type: type,
      style: drawStyle
    });

    this.map.addInteraction(this.draw);

    this.createMeasureTooltip();
    this.createHelpTooltip();

    let listener;
    this.draw.on('drawstart', (evt) => {
      this.sketch = evt.feature;

      listener = this.sketch.getGeometry().on('change', (evt) => {
        const geom = evt.target;
        let output;
        if (type === 'LineString') {
          output = this.formatLength(geom);
        } else if (type === 'Polygon') {
          output = this.formatArea(geom);
        }
        
        const tooltipCoord = type === 'LineString' ?
          geom.getLastCoordinate() :
          geom.getInteriorPoint().getCoordinates();

        this.measureTooltipElement.innerHTML = output;
        this.measureTooltip.setPosition(tooltipCoord);
      });
    });

    this.draw.on('drawend', () => {
      this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
      this.measureTooltip.setOffset([0, -7]);
      // 将当前测量提示添加到数组中
      this.measureTooltips.push({
        element: this.measureTooltipElement,
        overlay: this.measureTooltip
      });
      
      this.sketch = null;
      this.measureTooltipElement = null;
      this.measureTooltip = null;
      this.createMeasureTooltip();
      unByKey(listener);
    });
  }

  createHelpTooltip() {
    if (this.helpTooltipElement) {
      this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
    }
    this.helpTooltipElement = document.createElement('div');
    this.helpTooltipElement.className = 'ol-tooltip';
    this.helpTooltip = new Overlay({
      element: this.helpTooltipElement,
      offset: [15, 0],
      positioning: 'center-left'
    });
    this.map.addOverlay(this.helpTooltip);
  }

  createMeasureTooltip() {
    if (this.measureTooltipElement) {
      this.measureTooltipElement.parentNode.removeChild(this.measureTooltipElement);
    }
    this.measureTooltipElement = document.createElement('div');
    this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
    this.measureTooltip = new Overlay({
      element: this.measureTooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
      stopEvent: false,
      insertFirst: false
    });
    this.map.addOverlay(this.measureTooltip);
  }

  formatLength(line) {
    const length = getLength(line);
    let output;
    if (length > 100) {
      output = Math.round((length / 1000) * 100) / 100 + ' km';
    } else {
      output = Math.round(length * 100) / 100 + ' m';
    }
    return output;
  }

  formatArea(polygon) {
    const area = getArea(polygon);
    let output;
    if (area > 10000) {
      output = Math.round((area / 1000000) * 100) / 100 + ' km²';
    } else {
      output = Math.round(area * 100) / 100 + ' m²';
    }
    return output;
  }

  clear() {
    // 移除绘制交互
    this.removeInteraction();

    // 移除监听器
    if (this.listener) {
      unByKey(this.listener);
      this.listener = null;
    }

    // 清除矢量图层中的所有要素
    if (this.source) {
      this.source.clear();
    }
    
    // 移除帮助提示
    if (this.helpTooltip) {
      this.map.removeOverlay(this.helpTooltip);
      if (this.helpTooltipElement && this.helpTooltipElement.parentNode) {
        this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
      }
    }

    // 移除当前测量提示
    if (this.measureTooltip) {
      this.map.removeOverlay(this.measureTooltip);
      if (this.measureTooltipElement && this.measureTooltipElement.parentNode) {
        this.measureTooltipElement.parentNode.removeChild(this.measureTooltipElement);
      }
    }

    // 移除所有已保存的测量提示
    this.measureTooltips.forEach(tooltip => {
      this.map.removeOverlay(tooltip.overlay);
      if (tooltip.element && tooltip.element.parentNode) {
        tooltip.element.parentNode.removeChild(tooltip.element);
      }
    });
    this.measureTooltips = [];
    
    // 重置所有状态
    this.helpTooltipElement = null;
    this.helpTooltip = null;
    this.measureTooltipElement = null;
    this.measureTooltip = null;
    this.sketch = null;
  }

  // 移除测量交互
  removeInteraction() {
    if (this.draw) {
      this.map.removeInteraction(this.draw);
      this.draw = null;
    }
  }
} 