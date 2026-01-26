import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import PrimeVue from 'primevue/config'
import Noir from '@/presets/Noir'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { initSessionManager } from './services/sessionManager'

// Styles
import './assets/styles/main.css'
import 'primeicons/primeicons.css'

// Initialize session manager with router for handling session expiration
initSessionManager(router, i18n)

// Create Pinia instance
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// Create app
const app = createApp(App)

// Use plugins
app.use(router)
app.use(i18n)
app.use(pinia)

// Configure PrimeVue
const currentLocale = localStorage.getItem('locale') || 'fr'
app.use(PrimeVue, {
  theme: {
    preset: Noir,
    options: {
      prefix: 'p',
      darkModeSelector: '[data-theme="dark"]',
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue, components, utilities'
      }
    }
  },
  locale: i18n.global.messages.value[currentLocale]?.primevue || {},
  ripple: true
})

app.use(ToastService)

// Directives
app.directive('tooltip', Tooltip)

// Mount app
app.mount('#app')
