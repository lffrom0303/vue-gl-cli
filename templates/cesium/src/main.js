import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/main.css';

// 引入 Cesium 相关资源
import 'cesium/Build/Cesium/Widgets/widgets.css';

const app = createApp(App);
app.use(router);
app.mount('#app'); 