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

    <!-- Center: Breadcrumb or search (optional) -->
    <div class="hidden md:flex items-center flex-1 justify-center max-w-xl mx-4">
      <IconField class="w-full">
        <InputIcon>
          <i class="pi pi-search" />
        </InputIcon>
        <InputText 
          v-model="searchQuery" 
          :placeholder="$t('common.search')" 
          class="w-full"
        />
      </IconField>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-2">
      <!-- Theme toggle -->
      <Button 
        :icon="theme === 'light' ? 'pi pi-moon' : 'pi pi-sun'" 
        severity="secondary" 
        text 
        rounded
        @click="toggleTheme"
        v-tooltip.bottom="theme === 'light' ? 'Dark mode' : 'Light mode'"
      />

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
      <Button 
        :label="authStore.user?.first_name || ''" 
        icon="pi pi-user" 
        severity="secondary" 
        text
        @click="toggleUserMenu"
      />
      <Menu ref="userMenu" :model="userMenuItems" :popup="true" />
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Menu from 'primevue/menu'

const emit = defineEmits(['toggle-sidebar', 'open-profile'])

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

// Search
const searchQuery = ref('')

// Theme
const theme = ref(localStorage.getItem('theme') || 'light')

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  document.documentElement.setAttribute('data-theme', theme.value)
}

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
</script>
