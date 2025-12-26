<template>
  <div id="app">
    <!-- Connection lost overlay -->
    <ConnectionLostOverlay />
    
    <!-- Authenticated: Show layout -->
    <AppLayout v-if="authStore.isAuthenticated" />
    
    <!-- Not authenticated: Show login/register -->
    <router-view v-else />
    
    <!-- Headless Toast for file upload progress -->
    <Toast position="top-center" group="upload-progress" @close="onUploadToastClose">
      <template #container="{ message, closeCallback }">
        <section class="flex flex-col p-4 gap-4 w-80 bg-primary/90 rounded-xl">
          <div class="flex items-center gap-3">
            <i class="pi pi-cloud-upload text-white dark:text-black text-2xl"></i>
            <span class="font-bold text-base text-white dark:text-black">{{ message.summary }}</span>
          </div>
          <div class="flex flex-col gap-2">
            <ProgressBar :value="uploadStore.progress" :showValue="false" :style="{ height: '4px' }" pt:value:class="!bg-primary-50 dark:!bg-primary-900" class="!bg-primary/80"></ProgressBar>
            <label class="text-sm font-bold text-white dark:text-black">{{ uploadStore.progress }}% {{ $t('common.uploaded') }}</label>
          </div>
          <div class="flex gap-4 justify-end">
            <Button :label="$t('common.cancel')" size="small" severity="secondary" @click="cancelUpload(closeCallback)"></Button>
          </div>
        </section>
      </template>
    </Toast>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { useUploadStore } from '@/stores/uploadStore'
import { setConnectionStore } from '@/services/api'
import AppLayout from '@/components/layout/AppLayout.vue'
import ConnectionLostOverlay from '@/components/common/ConnectionLostOverlay.vue'
import Toast from 'primevue/toast'
import ProgressBar from 'primevue/progressbar'
import Button from 'primevue/button'

const authStore = useAuthStore()
const connectionStore = useConnectionStore()
const uploadStore = useUploadStore()

// Link connection store to API interceptor
setConnectionStore(connectionStore)

// Initialize auth on mount
onMounted(() => {
  authStore.initialize()
})

// Handle upload toast close
const onUploadToastClose = () => {
  uploadStore.reset()
}

// Cancel upload
const cancelUpload = (closeCallback) => {
  uploadStore.cancelUpload()
  closeCallback()
}
</script>

<style>
#app {
  font-family: var(--font-family);
}
</style>
