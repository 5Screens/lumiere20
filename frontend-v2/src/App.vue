<template>
  <div id="app">
    <!-- Connection lost overlay -->
    <ConnectionLostOverlay />
    
    <!-- Authenticated: Show layout -->
    <AppLayout v-if="authStore.isAuthenticated" />
    
    <!-- Not authenticated: Show login/register -->
    <router-view v-else />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { setConnectionStore } from '@/services/api'
import AppLayout from '@/components/layout/AppLayout.vue'
import ConnectionLostOverlay from '@/components/common/ConnectionLostOverlay.vue'

const authStore = useAuthStore()
const connectionStore = useConnectionStore()

// Link connection store to API interceptor
setConnectionStore(connectionStore)

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
