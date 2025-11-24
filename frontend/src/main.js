import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import App from './App.vue'
import i18n from './i18n'
import { useUserProfileStore } from './stores/userProfileStore'

// Tailwind CSS
import './assets/styles/tailwind.css'

// PrimeVue CSS - PrimeVue v4 uses CSS-in-JS theming, no need to import theme CSS
import 'primeicons/primeicons.css'

// Router configuration
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: App
    }
  ]
})

// Create Pinia instance
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(pinia)

// Initialize user profile store AFTER Pinia is installed
const userProfileStore = useUserProfileStore()

// Définir le thème et la langue depuis le store persistant
document.documentElement.setAttribute('data-theme', userProfileStore.theme)

// S'assurer que la langue est définie avant le montage de l'application
i18n.global.locale.value = userProfileStore.language
console.log(`Langue initialisée depuis le store: ${userProfileStore.language}`)

// Configure PrimeVue with the user's language
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '[data-theme="dark"]',
            cssLayer: {
                name: 'primevue',
                order: 'tailwind-base, primevue, tailwind-utilities'
            }
        }
    },
    // Configure locale from i18n
    locale: i18n.global.messages.value[userProfileStore.language]?.primevue || i18n.global.messages.value['en'].primevue,
    // Override primary color to use blue instead of green
    pt: {
        global: {
            css: `
                :root {
                    --p-primary-50: #e3f2fd;
                    --p-primary-100: #bbdefb;
                    --p-primary-200: #90caf9;
                    --p-primary-300: #64b5f6;
                    --p-primary-400: #42a5f5;
                    --p-primary-500: #2196f3;
                    --p-primary-600: #1e88e5;
                    --p-primary-700: #1976d2;
                    --p-primary-800: #1565c0;
                    --p-primary-900: #0d47a1;
                    --p-primary-950: #082f6b;
                }
                
                [data-theme="dark"] {
                    --p-primary-50: #082f6b;
                    --p-primary-100: #0d47a1;
                    --p-primary-200: #1565c0;
                    --p-primary-300: #1976d2;
                    --p-primary-400: #1e88e5;
                    --p-primary-500: #2196f3;
                    --p-primary-600: #42a5f5;
                    --p-primary-700: #64b5f6;
                    --p-primary-800: #90caf9;
                    --p-primary-900: #bbdefb;
                    --p-primary-950: #e3f2fd;
                }
            `
        }
    }
})
app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')
