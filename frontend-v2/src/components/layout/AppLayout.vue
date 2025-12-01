<template>
  <div class="h-screen flex flex-col" :data-theme="theme">
    <!-- Header -->
    <AppHeader 
      @toggle-sidebar="toggleSidebar" 
      @open-profile="profileDrawerOpen = true"
    />

    <!-- Main container -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar -->
      <AppSidebar 
        :collapsed="sidebarCollapsed" 
        @toggle-collapse="toggleSidebarCollapse"
        class="hidden md:flex"
      />

      <!-- Mobile sidebar overlay -->
      <div 
        v-if="sidebarOpen" 
        class="fixed inset-0 bg-black/50 z-40 md:hidden"
        @click="sidebarOpen = false"
      />
      
      <!-- Mobile sidebar -->
      <transition name="slide">
        <AppSidebar 
          v-if="sidebarOpen"
          :collapsed="false" 
          class="fixed left-0 top-14 bottom-0 z-50 md:hidden"
          @toggle-collapse="sidebarOpen = false"
        />
      </transition>

      <!-- Content area -->
      <main class="flex-1 overflow-hidden bg-surface-50 dark:bg-surface-900">
        <!-- Tabs system -->
        <AppTabs />
      </main>
    </div>

    <!-- Profile Drawer -->
    <ProfileDrawer v-model="profileDrawerOpen" />

    <!-- Toast & Dialogs -->
    <Toast position="bottom-right" />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import AppTabs from './AppTabs.vue'
import ProfileDrawer from './ProfileDrawer.vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

// Theme
const theme = ref(localStorage.getItem('theme') || 'light')

onMounted(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
})

// Sidebar state
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')

// Profile drawer state
const profileDrawerOpen = ref(false)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const toggleSidebarCollapse = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value)
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
