<template>
  <p v-if="ok" class="status-message success">✅ {{ okText }}</p>
  <p v-else-if="err" class="status-message error">❌ {{ err }}</p>
</template>

<script setup>
defineProps({
  ok: Boolean,
  okText: { type: String, default: 'OK' },
  err: String
})
</script>

<style scoped>
.status-message {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
}

.status-message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
