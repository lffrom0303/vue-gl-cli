import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/main.css';

// 引入 ArcGIS 样式
import '@arcgis/core/assets/esri/themes/light/main.css';

const app = createApp(App);
app.use(router);
app.mount('#app'); 