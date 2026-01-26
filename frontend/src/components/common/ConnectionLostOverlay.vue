<template>
  <div v-if="!connectionStore.isConnected" class="connection-overlay">
    <div class="connection-dialog">
      <!-- Icon -->
      <div class="icon-container">
        <i class="pi pi-server text-6xl text-red-500"></i>
        <div class="pulse-ring"></div>
      </div>

      <!-- Title -->
      <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-6">
        {{ t('connection.title') }}
      </h2>

      <!-- Description -->
      <p class="text-surface-600 dark:text-surface-400 mt-3 text-center max-w-md">
        {{ t('connection.description') }}
      </p>

      <!-- Error details (collapsible) -->
      <div v-if="connectionStore.lastError" class="mt-4 w-full max-w-md">
        <Button 
          :label="showDetails ? t('connection.hideDetails') : t('connection.showDetails')"
          text
          size="small"
          @click="showDetails = !showDetails"
          :icon="showDetails ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
          iconPos="right"
        />
        <Transition name="slide">
          <div v-if="showDetails" class="error-details mt-2 p-3 bg-surface-100 dark:bg-surface-800 rounded-lg text-sm">
            <p><strong>{{ t('connection.errorType') }}:</strong> {{ connectionStore.lastError.type }}</p>
            <p><strong>{{ t('connection.errorTime') }}:</strong> {{ formatTime(connectionStore.lastError.timestamp) }}</p>
          </div>
        </Transition>
      </div>

      <!-- Status -->
      <div class="mt-6 flex items-center gap-2">
        <template v-if="connectionStore.isRetrying">
          <ProgressSpinner style="width: 20px; height: 20px" strokeWidth="4" />
          <span class="text-surface-600 dark:text-surface-400">
            {{ t('connection.retrying', { count: connectionStore.retryCount, max: connectionStore.maxRetries }) }}
          </span>
        </template>
        <template v-else>
          <i class="pi pi-exclamation-circle text-orange-500"></i>
          <span class="text-surface-600 dark:text-surface-400">
            {{ t('connection.retryFailed') }}
          </span>
        </template>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex gap-3">
        <Button 
          :label="t('connection.retry')"
          icon="pi pi-refresh"
          @click="connectionStore.manualRetry()"
          :loading="connectionStore.isRetrying"
        />
        <Button 
          :label="t('connection.reload')"
          icon="pi pi-sync"
          severity="secondary"
          @click="connectionStore.forceReload()"
        />
      </div>

      <!-- Help text -->
      <p class="text-surface-500 text-sm mt-6 text-center">
        {{ t('connection.helpText') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConnectionStore } from '@/stores/connectionStore'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const { t } = useI18n()
const connectionStore = useConnectionStore()
const showDetails = ref(false)

function formatTime(timestamp) {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleTimeString()
}
</script>

<style scoped>
.connection-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.connection-dialog {
  background: var(--p-surface-0);
  border-radius: 1rem;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 500px;
  margin: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

:root[data-theme="dark"] .connection-dialog {
  background: var(--p-surface-900);
}

.icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-ring {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid var(--p-red-500);
  animation: pulse 2s ease-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.error-details {
  font-family: monospace;
}

.error-details p {
  margin: 0.25rem 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
