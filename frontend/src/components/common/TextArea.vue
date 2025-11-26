<template>
  <div class="text-area">
    <label 
      v-if="label" 
      :class="[
        'text-area__label',
        { 'text-area__label--required': required }
      ]"
    >
      {{ label }}
    </label>
    
    <div class="text-area__input-container">
      <textarea
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :rows="rows"
        :maxlength="maxlength"
        :class="[
          'text-area__input',
          { 'text-area__input--error': error }
        ]"
      ></textarea>
      
      <span v-if="error" class="text-area__error">{{ error }}</span>
      
      <div v-if="$slots.default" class="text-area__slot">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import '@/assets/styles/TextArea.css'

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
  },
  rows: {
    type: Number,
    default: 4
  },
  maxlength: {
    type: Number,
    default: null
  }
})

defineEmits(['update:modelValue'])
</script>
