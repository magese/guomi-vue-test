import { createApp } from 'vue'
import App from './App.vue'
import JsonViewer from 'vue-json-viewer'


createApp(App).use(JsonViewer).mount('#app')
