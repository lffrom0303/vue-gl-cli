import * as Cesium from 'cesium';

export class MeasureTool {
  constructor(viewer) {
    this.viewer = viewer;
    this.handler = null;
    this.measureType = null;
    this.activeShapePoints = [];
    this.activeShape = null;
    this.floatingPoint = null;
    this.markers = [];
    this.labelEntity = null;
    this.measuring = false;
    this.lastClickTime = 0; // 记录上次点击时间
  }

  startMeasure(type) {
    this.clear();
    this.measureType = type;
    this.measuring = true;
    this.lastClickTime = 0;

    // 创建鼠标事件处理器
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    // 鼠标左键点击事件
    this.handler.setInputAction((event) => {
      if (!this.measuring) return;
      
      const now = Date.now();
      const timeDiff = now - this.lastClickTime;
      this.lastClickTime = now;

      // 如果是双击（时间间隔小于 500ms）
      if (timeDiff < 500) {
        this.terminateMeasure();
        return;
      }
      
      const earthPosition = this.viewer.scene.pickPosition(event.position);
      if (Cesium.defined(earthPosition)) {
        if (this.activeShapePoints.length === 0) {
          this.floatingPoint = this.createPoint(earthPosition);
          this.activeShapePoints.push(earthPosition);
          const dynamicPositions = new Cesium.CallbackProperty(() => {
            if (this.measureType === 'distance') {
              return this.activeShapePoints;
            }
            return new Cesium.PolygonHierarchy(this.activeShapePoints);
          }, false);

          this.activeShape = this.measureType === 'distance'
            ? this.createPolyline(dynamicPositions)
            : this.createPolygon(dynamicPositions);
        }
        this.activeShapePoints.push(earthPosition);
        this.createPoint(earthPosition);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动事件
    this.handler.setInputAction((event) => {
      if (!this.measuring) return;
      
      if (this.activeShapePoints.length >= 1) {
        const newPosition = this.viewer.scene.pickPosition(event.endPosition);
        if (Cesium.defined(newPosition)) {
          this.floatingPoint.position.setValue(newPosition);
          this.activeShapePoints.pop();
          this.activeShapePoints.push(newPosition);
          
          // 更新测量结果
          if (this.measureType === 'distance') {
            this.updateDistance();
          } else {
            this.updateArea();
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 禁用默认的双击事件
    this.handler.setInputAction(() => {}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    // 鼠标右键结束测量
    this.handler.setInputAction(() => {
      if (!this.measuring) return;
      this.terminateMeasure();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  createPoint(position) {
    const point = this.viewer.entities.add({
      position: position,
      point: {
        color: Cesium.Color.WHITE,
        pixelSize: 5,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });
    this.markers.push(point);
    return point;
  }

  createPolyline(positions) {
    const polyline = this.viewer.entities.add({
      polyline: {
        positions: positions,
        clampToGround: true,
        width: 2,
        material: new Cesium.ColorMaterialProperty(Cesium.Color.YELLOW)
      }
    });
    this.markers.push(polyline);
    return polyline;
  }

  createPolygon(positions) {
    const polygon = this.viewer.entities.add({
      polygon: {
        hierarchy: positions,
        material: new Cesium.ColorMaterialProperty(
          Cesium.Color.YELLOW.withAlpha(0.3)
        ),
        outline: true,
        outlineColor: Cesium.Color.YELLOW
      }
    });
    this.markers.push(polygon);
    return polygon;
  }

  updateDistance() {
    let distance = 0;
    for (let i = 0; i < this.activeShapePoints.length - 1; i++) {
      distance += Cesium.Cartesian3.distance(
        this.activeShapePoints[i],
        this.activeShapePoints[i + 1]
      );
    }
    this.showLabel(
      this.activeShapePoints[this.activeShapePoints.length - 1],
      `距离: ${(distance / 1000).toFixed(2)} 公里`
    );
  }

  updateArea() {
    if (this.activeShapePoints.length >= 3) {
      // 计算面积
      const area = this.calculateArea(this.activeShapePoints);
      
      // 根据面积大小选择合适的单位
      let areaText;
      if (area > 1000000) {
        areaText = `面积: ${(area / 1000000).toFixed(2)} 平方公里`;
      } else {
        areaText = `面积: ${area.toFixed(2)} 平方米`;
      }

      this.showLabel(
        this.activeShapePoints[0],
        areaText
      );
    }
  }

  calculateArea(positions) {
    if (positions.length < 3) return 0;

    // 确保多边形是闭合的
    const points = [...positions];
    if (!Cesium.Cartesian3.equals(points[0], points[points.length - 1])) {
      points.push(points[0]);
    }

    let area = 0;
    const perPositionHeight = true;
    const ellipsoid = Cesium.Ellipsoid.WGS84;

    // 将笛卡尔坐标转换为地理坐标
    const coordinates = points.map(position => {
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      return {
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        latitude: Cesium.Math.toDegrees(cartographic.latitude)
      };
    });

    // 使用球面多边形面积公式计算
    for (let i = 0; i < coordinates.length - 1; i++) {
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];
      area += (p2.longitude - p1.longitude) * 
              (2 + Math.sin(Cesium.Math.toRadians(p1.latitude)) + 
                  Math.sin(Cesium.Math.toRadians(p2.latitude)));
    }

    area = Math.abs(area * 6378137.0 * 6378137.0 / 2.0);
    return area;
  }

  showLabel(position, text) {
    if (this.labelEntity) {
      this.viewer.entities.remove(this.labelEntity);
    }
    this.labelEntity = this.viewer.entities.add({
      position: position,
      label: {
        text: text,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });
    this.markers.push(this.labelEntity);
  }

  terminateMeasure() {
    if (!this.measuring) return;
    
    this.measuring = false;
    
    if (this.activeShapePoints.length > 0) {
      this.activeShapePoints.pop(); // 移除最后一个移动点
      
      // 创建最终的测量图形
      if (this.measureType === 'distance' && this.activeShapePoints.length >= 2) {
        // 创建最终的线段
        const finalLine = this.viewer.entities.add({
          polyline: {
            positions: this.activeShapePoints,
            clampToGround: true,
            width: 2,
            material: new Cesium.ColorMaterialProperty(Cesium.Color.YELLOW)
          }
        });
        this.markers.push(finalLine);
        this.updateDistance();
      } else if (this.measureType === 'area' && this.activeShapePoints.length >= 3) {
        // 创建最终的多边形
        const finalPolygon = this.viewer.entities.add({
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(this.activeShapePoints),
            material: new Cesium.ColorMaterialProperty(
              Cesium.Color.YELLOW.withAlpha(0.3)
            ),
            outline: true,
            outlineColor: Cesium.Color.YELLOW
          }
        });
        this.markers.push(finalPolygon);
        this.updateArea();
      }
    }

    // 移除临时实体
    if (this.floatingPoint) {
      this.viewer.entities.remove(this.floatingPoint);
      this.floatingPoint = null;
    }
    if (this.activeShape) {
      this.viewer.entities.remove(this.activeShape);
      this.activeShape = null;
    }

    // 销毁事件处理器
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }

    // 重置动态点集合，但保留标记点和测量结果
    this.activeShapePoints = [];
  }

  clear() {
    this.measuring = false;
    
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
    
    this.markers.forEach(marker => {
      this.viewer.entities.remove(marker);
    });
    this.markers = [];
    
    if (this.activeShape) {
      this.viewer.entities.remove(this.activeShape);
    }
    if (this.floatingPoint) {
      this.viewer.entities.remove(this.floatingPoint);
    }
    if (this.labelEntity) {
      this.viewer.entities.remove(this.labelEntity);
    }
    
    this.activeShape = null;
    this.floatingPoint = null;
    this.labelEntity = null;
    this.activeShapePoints = [];
    this.measureType = null;
  }
} 