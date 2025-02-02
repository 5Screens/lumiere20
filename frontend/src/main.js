import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import App from './App.vue'

// Router configuration
const router = createRouter({
  history: createWebHistory(),
  routes: [] // Routes will be added later
})

// i18n configuration
const i18n = createI18n({
  locale: 'fr',
  fallbackLocale: 'en',
  messages: {
    fr: {
      // Messages will be added later
    },
    en: {
      // Messages will be added later
    }
  }
})

const app = createApp(App)
app.use(router)
app.use(i18n)
app.mount('#app')
