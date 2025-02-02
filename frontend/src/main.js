import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import i18n from './i18n'

// Router configuration
const router = createRouter({
  history: createWebHistory(),
  routes: [] // Routes will be added later
})

const app = createApp(App)
app.use(router)
app.use(i18n)
app.mount('#app')
