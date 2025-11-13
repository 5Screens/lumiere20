<template>
  <div class="checkbox">
    <label 
      v-if="label" 
      class="checkbox__label"
    >
      {{ label }}
    </label>
    
    <div class="checkbox__input-container">
      <label class="checkbox__item-label">
        <input
          type="checkbox"
          :checked="modelValue"
          @change="$emit('update:modelValue', $event.target.checked)"
          :disabled="disabled"
          class="checkbox__input"
        />
        <span class="checkbox__item-text">{{ itemLabel }}</span>
      </label>
      
      <span v-if="error" class="checkbox__error">{{ error }}</span>
      
      <div v-if="$slots.default" class="checkbox__slot">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import '@/assets/styles/Checkbox.css'

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  itemLabel: {
    type: String,
    default: ''
  },
  modelValue: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue'])
</script>
