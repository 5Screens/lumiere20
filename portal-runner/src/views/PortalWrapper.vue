<template>
  <div class="min-h-screen bg-surface-50 dark:bg-surface-900">
    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center min-h-screen">
      <ProgressSpinner />
      <p class="mt-4 text-surface-600 dark:text-surface-400">{{ $t('portal.loading') }}</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center min-h-screen">
      <i class="pi pi-exclamation-triangle text-6xl text-red-500 mb-4"></i>
      <h2 class="text-2xl font-semibold text-surface-800 dark:text-surface-200 mb-2">{{ $t('portal.error') }}</h2>
      <p class="text-surface-600 dark:text-surface-400">{{ error }}</p>
    </div>
    
    <!-- Dynamic Component based on portal.view_component -->
    <component 
      v-else-if="currentComponent" 
      :is="currentComponent" 
      :portal-data="portalData"
      :portal-code="portalCode"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { getFullPortal } from '@/services/portals'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const portalData = ref(null)
const loading = ref(true)
const error = ref('')

const portalCode = computed(() => route.params.portalCode)

// Map of available portal view components
const componentMap = {
  'PortalViewV2': defineAsyncComponent(() => import('@/views/PortalViewV2.vue'))
}

const currentComponent = computed(() => {
  if (!portalData.value) return null
  
  if (!portalData.value.view_component) {
    throw new Error('Portal data loaded but view_component is missing')
  }
  
  const componentName = portalData.value.view_component
  
  if (!componentMap[componentName]) {
    // Fallback to V2 if component not found
    console.warn(`Component "${componentName}" not found, using PortalViewV2`)
    return componentMap['PortalViewV2']
  }
  
  return componentMap[componentName]
})

onMounted(async () => {
  try {
    portalData.value = await getFullPortal(portalCode.value)
    
    if (!portalData.value.is_active) {
      error.value = 'portal.disabled'
    }
  } catch (e) {
    console.error('Error loading portal:', e)
    error.value = e?.message || 'portal.notFound'
  } finally {
    loading.value = false
  }
})
</script>
