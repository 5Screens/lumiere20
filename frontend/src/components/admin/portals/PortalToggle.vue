<template>
  <button
    type="button"
    class="portal-toggle"
    :class="{ 'is-active': modelValue, 'is-loading': loading }"
    :disabled="loading"
    :aria-checked="modelValue"
    role="switch"
    @click="handleToggle"
  >
    <span class="portal-toggle__track">
      <span class="portal-toggle__thumb">
        <i v-if="loading" class="fas fa-spinner fa-spin"></i>
      </span>
    </span>
  </button>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'toggle']);

const handleToggle = () => {
  if (!props.loading) {
    emit('update:modelValue', !props.modelValue);
    emit('toggle');
  }
};
</script>

<style scoped>
.portal-toggle {
  position: relative;
  width: 44px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.portal-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.portal-toggle__track {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--border-color);
  border-radius: 12px;
  transition: background-color 0.3s ease;
  position: relative;
}

.portal-toggle.is-active .portal-toggle__track {
  background: var(--primary-color);
}

.portal-toggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.portal-toggle.is-active .portal-toggle__thumb {
  transform: translateX(20px);
}

.portal-toggle__thumb i {
  font-size: 10px;
  color: var(--primary-color);
}

.portal-toggle:hover:not(:disabled) .portal-toggle__track {
  opacity: 0.9;
}

.portal-toggle:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
</style>
