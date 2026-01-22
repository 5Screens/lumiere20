<template>
  <header class="flex items-center justify-between h-14 px-4 bg-surface-0 border-b border-surface-200">
    <!-- Left: Logo + Menu toggle -->
    <div class="flex items-center gap-3">
      <Button 
        icon="pi pi-bars" 
        severity="secondary" 
        text 
        rounded
        @click="$emit('toggle-sidebar')"
      />
      <router-link to="/" class="flex items-center gap-2 text-primary font-bold text-lg">
        <i class="pi pi-bolt"></i>
        <span class="hidden sm:inline">Lumiere V2</span>
      </router-link>
    </div>

    <!-- Center: Global search -->
    <div class="hidden md:flex items-center flex-1 justify-center max-w-6xl mx-4">
      <GlobalSearch />
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-2">
      <!-- Debug: Responsive mode indicator -->
      <div 
        class="flex items-center gap-1 px-2 py-1 rounded text-white text-xs font-mono"
        :class="responsiveMode.color"
        v-tooltip.bottom="'Debug: Screen size'"
      >
        <i class="pi" :class="responsiveMode.icon"></i>
        <span>{{ responsiveMode.label }}</span>
        <span class="opacity-75">{{ windowWidth }}px</span>
      </div>

      <!-- Language selector -->
      <Button 
        severity="secondary" 
        text 
        rounded
        @click="toggleLanguageMenu"
        v-tooltip.bottom="$t('profile.language')"
        class="p-2"
      >
        <span 
          class="fi fis rounded-sm" 
          :class="`fi-${currentLanguage?.flag_code?.toLowerCase() || 'fr'}`"
          style="font-size: 1.25rem;"
        ></span>
      </Button>
      <Menu ref="languageMenu" :model="languageMenuItems" :popup="true" />

      <!-- Theme toggle -->
      <Button 
        :icon="theme === 'light' ? 'pi pi-moon' : 'pi pi-sun'" 
        severity="secondary" 
        text 
        rounded
        @click="toggleTheme"
        v-tooltip.bottom="theme === 'light' ? 'Dark mode' : 'Light mode'"
      />

      <!-- Theme customizer -->
      <ThemeSwitcher />

      <!-- Notifications -->
      <Button 
        icon="pi pi-bell" 
        severity="secondary" 
        text 
        rounded
        badge="3"
        badgeSeverity="danger"
      />

      <!-- User menu -->
      <Avatar 
        :label="userInitials" 
        shape="circle"
        class="cursor-pointer bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
        @click="toggleUserMenu"
      />
      <Menu ref="userMenu" :model="userMenuItems" :popup="true" />
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePrimeVue } from 'primevue/config'
import { useAuthStore } from '@/stores/authStore'
import { useResponsiveSize } from '@/composables/useResponsiveSize'
import languagesService from '@/services/languagesService'
import metadataService from '@/services/metadataService'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Avatar from 'primevue/avatar'
import ThemeSwitcher from '@/components/layout/ThemeSwitcher.vue'
import GlobalSearch from '@/components/layout/GlobalSearch.vue'

const emit = defineEmits(['toggle-sidebar', 'open-profile'])

const router = useRouter()
const { windowWidth, isMobile, isTablet, isDesktop } = useResponsiveSize()

const responsiveMode = computed(() => {
  if (isMobile.value) return { label: 'Mobile', icon: 'pi-mobile', color: 'bg-orange-500' }
  if (isTablet.value) return { label: 'Tablet', icon: 'pi-tablet', color: 'bg-blue-500' }
  return { label: 'Desktop', icon: 'pi-desktop', color: 'bg-green-500' }
})
const { t, locale, messages } = useI18n()
const primevue = usePrimeVue()
const authStore = useAuthStore()

// Languages
const languages = ref([])
const languageMenu = ref()

const loadLanguages = async () => {
  try {
    languages.value = await languagesService.getActiveLanguages()
  } catch (error) {
    console.error('Error loading languages:', error)
    languages.value = [
      { code: 'fr', name: 'Français', flag_code: 'fr' },
      { code: 'en', name: 'English', flag_code: 'gb' }
    ]
  }
}

const currentLanguage = computed(() => {
  return languages.value.find(l => l.code === locale.value) || { flag_code: 'fr' }
})

const languageMenuItems = computed(() => 
  languages.value.map(lang => ({
    label: lang.name,
    icon: `fi fi-${lang.flag_code?.toLowerCase()}`,
    class: locale.value === lang.code ? 'bg-primary-50 dark:bg-primary-900/20' : '',
    command: () => changeLanguage(lang.code)
  }))
)

const toggleLanguageMenu = (event) => {
  languageMenu.value.toggle(event)
}

const changeLanguage = (code) => {
  locale.value = code
  localStorage.setItem('locale', code)
  metadataService.clearCache()
  
  // Update PrimeVue locale dynamically
  const primeVueLocale = messages.value[code]?.primevue
  if (primeVueLocale) {
    primevue.config.locale = primeVueLocale
  }
}

// Theme
const theme = ref(localStorage.getItem('theme') || 'light')

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  document.documentElement.setAttribute('data-theme', theme.value)
}

// User initials for avatar
const userInitials = computed(() => {
  const first = authStore.user?.first_name?.[0] || ''
  const last = authStore.user?.last_name?.[0] || ''
  return (first + last).toUpperCase() || '?'
})

// User menu
const userMenu = ref()
const userMenuItems = computed(() => [
  {
    label: authStore.fullName,
    items: [
      {
        label: t('auth.profile') || 'Profile',
        icon: 'pi pi-user',
        command: () => emit('open-profile')
      },
      {
        label: t('auth.settings') || 'Settings',
        icon: 'pi pi-cog',
        command: () => router.push('/settings')
      },
      { separator: true },
      {
        label: t('auth.logout'),
        icon: 'pi pi-sign-out',
        command: async () => {
          await authStore.logout()
          router.push('/login')
        }
      }
    ]
  }
])

const toggleUserMenu = (event) => {
  userMenu.value.toggle(event)
}

onMounted(() => {
  loadLanguages()
})
</script>

<style>
/* Custom style for language menu items with flag icons */
.p-menu .fi {
  font-size: 1rem;
  margin-right: 0.5rem;
}
</style>
