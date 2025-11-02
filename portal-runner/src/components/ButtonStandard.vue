<script setup>
import { ref } from 'vue'
import api from '@/services/api'
import StatusInline from './StatusInline.vue'

const props = defineProps({
  demoPayload: Object, // Optional: for demo mode (POC)
  action: Object       // Optional: { http_method, endpoint, payload_json, headers_json? }
})

const loading = ref(false)
const ok = ref(false)
const err = ref('')

async function run() {
  loading.value = true
  ok.value = false
  err.value = ''

  try {
    if (props.action) {
      // Config mode: execute action from portal configuration
      await api({
        method: props.action.http_method || 'POST',
        url: props.action.endpoint,
        data: props.action.payload_json || {},
        headers: props.action.headers_json || {}
      })
    } else if (props.demoPayload) {
      // Demo mode: hardcoded POST to /tickets
      await api.post('/api/v1/tickets', props.demoPayload)
    } else {
      throw new Error('No action or demo payload provided')
    }
    ok.value = true
  } catch (e) {
    err.value = e?.response?.data?.message || e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="button-container">
    <button :disabled="loading" class="btn" @click="run">
      {{ loading ? 'En cours…' : 'Créer le ticket' }}
    </button>
    <StatusInline :ok="ok" okText="Ticket créé avec succès" :err="err" />
  </div>
</template>

<style scoped>
.button-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.btn {
  border-radius: 9999px;
  padding: 12px 24px;
  border: 1px solid #ddd;
  background: #111;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:hover:not(:disabled) {
  background: #333;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
