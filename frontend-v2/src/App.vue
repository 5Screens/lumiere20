<template>
  <div id="app" class="h-screen flex flex-col" :data-theme="theme">
    <!-- Header (only show when authenticated) -->
    <header v-if="authStore.isAuthenticated" class="flex items-center justify-between px-4 py-2 bg-surface-0 border-b border-surface-200">
      <div class="flex items-center gap-4">
        <router-link to="/" class="flex items-center gap-2 text-primary font-semibold">
          <i class="pi pi-home"></i>
          <span>Lumiere V2</span>
        </router-link>
        <nav class="flex gap-2">
          <router-link to="/configuration-items">
            <Button label="Configuration Items" icon="pi pi-cog" severity="secondary" text />
          </router-link>
        </nav>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="authStore.user" class="text-surface-600">
          {{ authStore.fullName }}
        </span>
        <Button 
          :icon="theme === 'light' ? 'pi pi-moon' : 'pi pi-sun'" 
          severity="secondary" 
          text 
          rounded
          @click="toggleTheme"
        />
        <Select 
          v-model="locale" 
          :options="languages" 
          optionLabel="label" 
          optionValue="value"
          class="w-32"
        />
        <Button 
          icon="pi pi-sign-out" 
          severity="secondary" 
          text 
          rounded
          @click="handleLogout"
          v-tooltip.bottom="$t('auth.logout')"
        />
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 overflow-auto" :class="{ 'p-4 bg-surface-50': authStore.isAuthenticated }">
      <router-view />
    </main>

    <!-- Toast -->
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Tooltip from 'primevue/tooltip'

const router = useRouter()
const { locale: i18nLocale } = useI18n()
const authStore = useAuthStore()

// Initialize auth on mount
onMounted(() => {
  authStore.initialize()
})

// Logout handler
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Theme
const theme = ref(localStorage.getItem('theme') || 'light')

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  document.documentElement.setAttribute('data-theme', theme.value)
}

// Initialize theme
document.documentElement.setAttribute('data-theme', theme.value)

// Language
const languages = [
  { label: 'Français', value: 'fr' },
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: 'Português', value: 'pt' }
]

const locale = computed({
  get: () => i18nLocale.value,
  set: (val) => {
    i18nLocale.value = val
    localStorage.setItem('locale', val)
  }
})

// Initialize locale
const savedLocale = localStorage.getItem('locale')
if (savedLocale) {
  i18nLocale.value = savedLocale
}
</script>

<style>
#app {
  font-family: var(--font-family);
}
</style>
