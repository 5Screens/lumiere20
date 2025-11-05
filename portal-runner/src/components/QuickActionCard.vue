<template>
  <button class="quick-action-card" @click="handleClick" :disabled="loading">
    <div class="card-icon">
      <i v-if="action.icon_type === 'fontawesome'" :class="['fas', action.icon_value]"></i>
      <img v-else-if="action.icon_type === 'image'" :src="action.icon_value" alt="icon" />
    </div>
    <div class="card-content">
      <h3 class="card-title">{{ action.display_title }}</h3>
      <p class="card-description">{{ action.description }}</p>
    </div>
    <div v-if="loading" class="card-loading">
      <div class="spinner"></div>
    </div>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/services/api'

const props = defineProps({
  action: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['success', 'error'])

const loading = ref(false)

const handleClick = async () => {
  loading.value = true
  
  try {
    const { http_method, endpoint, payload_json, headers_json } = props.action
    
    let response
    if (http_method === 'POST') {
      response = await api.post(endpoint, payload_json, { headers: headers_json })
    } else if (http_method === 'GET') {
      response = await api.get(endpoint, { headers: headers_json })
    } else if (http_method === 'PATCH') {
      response = await api.patch(endpoint, payload_json, { headers: headers_json })
    } else if (http_method === 'PUT') {
      response = await api.put(endpoint, payload_json, { headers: headers_json })
    } else if (http_method === 'DELETE') {
      response = await api.delete(endpoint, { headers: headers_json })
    }
    
    emit('success', response.data)
  } catch (error) {
    console.error('Action error:', error)
    emit('error', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.quick-action-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  min-height: 180px;
}

.quick-action-card:hover:not(:disabled) {
  border-color: var(--primary-color, #FF6B00);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.quick-action-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-icon {
  font-size: 48px;
  color: var(--primary-color, #FF6B00);
  margin-bottom: 16px;
}

.card-icon img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #111;
  margin: 0 0 8px 0;
}

.card-description {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.card-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color, #FF6B00);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
