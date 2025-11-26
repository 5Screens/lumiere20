<template>
  <div class="color-picker">
    <label 
      v-if="label" 
      :class="[
        'color-picker__label',
        { 'color-picker__label--required': required }
      ]"
    >
      {{ label }}
    </label>
    
    <div class="color-picker__input-container">
      <div class="color-picker__controls">
        <input
          type="color"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          :disabled="disabled"
          class="color-picker__color-input"
        />
        
        <input
          type="text"
          :value="modelValue"
          @input="handleTextInput"
          :placeholder="placeholder"
          :disabled="disabled"
          :maxlength="7"
          :class="[
            'color-picker__text-input',
            { 'color-picker__text-input--error': error }
          ]"
        />
      </div>
      
      <span v-if="error" class="color-picker__error">{{ error }}</span>
      
      <div v-if="$slots.default" class="color-picker__slot">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import '@/assets/styles/ColorPicker.css'

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
    default: '#000000'
  },
  disabled: {
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

const emit = defineEmits(['update:modelValue'])

const handleTextInput = (event) => {
  let value = event.target.value
  
  // Ensure the value starts with #
  if (value && !value.startsWith('#')) {
    value = '#' + value
  }
  
  emit('update:modelValue', value)
}
</script>
