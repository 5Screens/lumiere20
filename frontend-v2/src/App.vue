<template>
  <div id="app">
    <!-- Authenticated: Show layout -->
    <AppLayout v-if="authStore.isAuthenticated" />
    
    <!-- Not authenticated: Show login/register -->
    <router-view v-else />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import AppLayout from '@/components/layout/AppLayout.vue'

const authStore = useAuthStore()

// Initialize auth on mount
onMounted(() => {
  authStore.initialize()
})
</script>

<style>
#app {
  font-family: var(--font-family);
}
</style>
