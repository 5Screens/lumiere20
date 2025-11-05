<template>
  <div :class="['alert-banner', `alert-${alert.alert_type}`]">
    <div class="alert-icon">
      <i :class="iconClass"></i>
    </div>
    <div class="alert-message">{{ alert.message }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  alert: {
    type: Object,
    required: true
  }
})

const iconClass = computed(() => {
  switch (props.alert.alert_type) {
    case 'warning':
      return 'fas fa-exclamation-triangle'
    case 'error':
      return 'fas fa-times-circle'
    case 'info':
    default:
      return 'fas fa-info-circle'
  }
})
</script>

<style scoped>
.alert-banner {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
}

.alert-icon {
  margin-right: 12px;
  font-size: 20px;
  flex-shrink: 0;
}

.alert-message {
  flex: 1;
}

.alert-info {
  background: #e3f2fd;
  border: 1px solid #90caf9;
  color: #1565c0;
}

.alert-warning {
  background: #fff3e0;
  border: 1px solid #ffb74d;
  color: #e65100;
}

.alert-error {
  background: #ffebee;
  border: 1px solid #ef5350;
  color: #c62828;
}
</style>
