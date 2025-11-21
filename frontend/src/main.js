import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import HomePage from './components/HomePage.vue'
import i18n from './i18n'
import { useUserProfileStore } from './stores/userProfileStore'

// Router configuration
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      // component: App
      component: HomePage
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

// Initialize user profile store, theme and language
const userProfileStore = useUserProfileStore()

// Définir le thème et la langue depuis le store persistant
document.documentElement.setAttribute('data-theme', userProfileStore.theme)

// S'assurer que la langue est définie avant le montage de l'application
i18n.global.locale.value = userProfileStore.language
console.log(`Langue initialisée depuis le store: ${userProfileStore.language}`)

app.mount('#app')
