<template>
  <div class="dashboard-widget">
    <h3 class="widget-title">{{ widget.display_title }}</h3>
    <div v-if="loading" class="widget-loading">
      <div class="spinner"></div>
    </div>
    <div v-else-if="error" class="widget-error">
      <i class="fas fa-exclamation-triangle"></i>
      <span>Erreur de chargement</span>
    </div>
    <div v-else class="widget-content">
      <!-- Counter widget -->
      <div v-if="widget.widget_type === 'counter'" class="widget-counter">
        <span class="counter-value">{{ counterValue }}</span>
      </div>
      
      <!-- List widget -->
      <div v-else-if="widget.widget_type === 'list'" class="widget-list">
        <div v-for="(item, index) in listData" :key="index" class="list-item">
          {{ item }}
        </div>
      </div>
      
      <!-- Custom widget -->
      <div v-else class="widget-custom">
        {{ widgetData }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { executeWidgetApi } from '@/services/portals'

const props = defineProps({
  widget: {
    type: Object,
    required: true
  }
})

const loading = ref(true)
const error = ref(false)
const widgetData = ref(null)
let refreshInterval = null

const counterValue = computed(() => {
  if (!widgetData.value) return 0
  // If response has total field, use it
  if (widgetData.value.total !== undefined) return widgetData.value.total
  // If response is array, return length
  if (Array.isArray(widgetData.value)) return widgetData.value.length
  // If response has data array, return its length
  if (widgetData.value.data && Array.isArray(widgetData.value.data)) {
    return widgetData.value.data.length
  }
  return 0
})

const listData = computed(() => {
  if (!widgetData.value) return []
  if (Array.isArray(widgetData.value)) return widgetData.value
  if (widgetData.value.data && Array.isArray(widgetData.value.data)) {
    return widgetData.value.data
  }
  return []
})

const loadData = async () => {
  try {
    loading.value = true
    error.value = false
    const data = await executeWidgetApi(props.widget)
    widgetData.value = data
  } catch (err) {
    console.error('Widget error:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadData()
  
  // Setup auto-refresh if configured
  if (props.widget.refresh_interval && props.widget.refresh_interval > 0) {
    refreshInterval = setInterval(loadData, props.widget.refresh_interval * 1000)
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.dashboard-widget {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.widget-title {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.widget-loading,
.widget-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: #999;
}

.widget-error {
  color: #d32f2f;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color, #FF6B00);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.widget-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.widget-counter {
  text-align: center;
}

.counter-value {
  font-size: 48px;
  font-weight: 700;
  color: var(--primary-color, #FF6B00);
  line-height: 1;
}

.widget-list {
  width: 100%;
}

.list-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #333;
}

.list-item:last-child {
  border-bottom: none;
}

.widget-custom {
  font-size: 14px;
  color: #333;
}
</style>
