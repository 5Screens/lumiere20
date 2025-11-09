<template>
  <div class="portal-wrapper">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Chargement du portail…</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <h2>❌ Erreur</h2>
      <p>{{ error }}</p>
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

const route = useRoute()
const portalData = ref(null)
const loading = ref(true)
const error = ref('')

const portalCode = computed(() => route.params.portalCode)

// Map of available components
const componentMap = {
  'PortalViewV1': defineAsyncComponent(() => import('@/views/PortalViewV1.vue')),
  'PortalView': defineAsyncComponent(() => import('@/views/PortalView.vue'))
}

const currentComponent = computed(() => {
  // Return null during loading or if no data yet
  if (!portalData.value) {
    return null
  }
  
  // After loading, view_component MUST exist
  if (!portalData.value.view_component) {
    throw new Error('Portal data loaded but view_component is missing')
  }
  
  const componentName = portalData.value.view_component
  
  // Component MUST exist in componentMap
  if (!componentMap[componentName]) {
    throw new Error(`Component "${componentName}" not found in componentMap. Available components: ${Object.keys(componentMap).join(', ')}`)
  }
  
  return componentMap[componentName]
})

onMounted(async () => {
  try {
    portalData.value = await getFullPortal(portalCode.value)
    
    if (!portalData.value.is_active) {
      error.value = 'Portail désactivé'
    }
  } catch (e) {
    console.error('Error loading portal:', e)
    error.value = e?.response?.data?.message || 'Portail introuvable'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.portal-wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

/* Loading & Error States */
.loading-container,
.error-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #FF6B00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  color: #d32f2f;
}

.error-container h2 {
  font-size: 24px;
  margin-bottom: 12px;
}

.error-container p {
  font-size: 16px;
}
</style>
