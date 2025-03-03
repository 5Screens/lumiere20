<template>
  <div class="text-field">
    <label 
      v-if="label" 
      :class="[
        'text-field__label',
        { 'text-field__label--required': required }
      ]"
    >
      {{ label }}
    </label>
    
    <div class="text-field__input-container">
      <input
        type="text"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :class="[
          'text-field__input',
          { 'text-field__input--error': error }
        ]"
      />
      
      <span v-if="error" class="text-field__error">{{ error }}</span>
      
      <div v-if="$slots.default" class="text-field__slot">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import '@/assets/styles/TextField.css'

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  modelValue: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  required: {
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
