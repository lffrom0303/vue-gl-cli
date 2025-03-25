# Vue GL CLI

一个用于生成基于 Vue 3 的 3D 地图库项目模板的命令行工具。支持多种三维库，包括高德地图、百度地图、Cesium、ArcGIS、OpenLayers 和 Three.js。

## 特性

- 支持多种三维库模板
- 基于 Vue 3 + Vite
- 包含基础的项目结构
- 集成常用的开发工具和配置

## 安装

```bash
npm install -g vue-gl-cli
```

## 使用方法

创建新项目：

```bash
vue-gl create my-project
```

然后按照提示选择需要使用的三维库模板。

## 支持的模板

- 高德地图 (AMap)
- 百度地图 (BMap)
- Cesium
- ArcGIS
- OpenLayers
- Three.js

## 项目结构

每个生成的项目都包含以下基本结构：

```
project-name/
├── src/
│   ├── assets/
│   ├── components/
│   ├── router/
│   ├── stores/
│   ├── views/
│   ├── App.vue
│   └── main.js
├── public/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 开发

1. 克隆项目

```bash
git clone https://github.com/yourusername/vue-gl-cli.git
```

2. 安装依赖

```bash
cd vue-gl-cli
npm install
```

3. 链接到全局

```bash
npm link
```

## License

MIT
