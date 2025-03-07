<template>
  <div 
    :class="[
      's-text-field', 
      { 's-text-field--editing': isEditing && valueChanged }
    ]"
  >
    <div class="s-text-field__label-container" v-if="label">
      <label 
        :class="[
          's-text-field__label',
          { 's-text-field__label--required': required }
        ]"
      >
        {{ label }}
      </label>
    </div>
    
    <div class="s-text-field__input-container">
      <input
        :type="inputType"
        :value="modelValue"
        @input="handleInput"
        @focus="onFocus"
        @blur="onBlur"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :min="min"
        :max="max"
        :step="step"
        :class="[
          's-text-field__input',
          { 's-text-field__input--error': error }
        ]"
      />
      
      <div class="s-text-field__actions">
        <template v-if="isEditing && valueChanged">
          <button 
            type="button" 
            class="s-text-field__action-btn s-text-field__action-btn--confirm"
            @click="confirmChange"
            title="Confirm"
          >
            <svg class="s-text-field__action-icon" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path>
            </svg>
          </button>
          <button 
            type="button" 
            class="s-text-field__action-btn s-text-field__action-btn--cancel"
            @click="cancelChange"
            title="Cancel"
          >
            <svg class="s-text-field__action-icon" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path>
            </svg>
          </button>
        </template>
        <slot name="actions" v-else></slot>
      </div>
      
      <span v-if="error" class="s-text-field__error">{{ error }}</span>
      <span v-else-if="helperText" class="s-text-field__helper">{{ helperText }}</span>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue'
import '@/assets/styles/sTextField.css'

const isEditing = ref(false)
const internalValue = ref('')
const originalValue = ref('')
const valueChanged = ref(false)

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  modelValue: {
    type: [String, Number],
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
  helperText: {
    type: String,
    default: ''
  },
  inputType: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'number', 'email', 'password', 'tel'].includes(value)
  },
  min: {
    type: [Number, String],
    default: undefined
  },
  max: {
    type: [Number, String],
    default: undefined
  },
  step: {
    type: [Number, String],
    default: undefined
  },
  uuid: {
    type: String,
    default: ''
  },
  fieldName: {
    type: String,
    default: ''
  },
  apiEndpoint: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'field-updated', 'field-change-cancelled'])

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  originalValue.value = newValue
  internalValue.value = newValue
})

// Initialize values
internalValue.value = props.modelValue
originalValue.value = props.modelValue

const handleInput = (event) => {
  let value = event.target.value
  
  // Convert to number if input type is number
  if (props.inputType === 'number' && value !== '') {
    value = props.step && props.step.toString().includes('.') 
      ? parseFloat(value) 
      : parseInt(value, 10)
  }
  
  internalValue.value = value
  emit('update:modelValue', value)
  
  // Check if value has changed
  valueChanged.value = value !== originalValue.value
}

const onFocus = () => {
  isEditing.value = true
  originalValue.value = props.modelValue
}

const onBlur = () => {
  // Don't reset isEditing here to allow clicking on action buttons
  // Will be reset in cancelChange or after API call
}

const confirmChange = async () => {
  if (!props.uuid || !props.apiEndpoint) {
    console.warn('UUID or API endpoint not provided for field update')
    emit('field-updated', {
      success: false,
      fieldName: props.fieldName,
      value: internalValue.value,
      error: 'UUID or API endpoint not provided'
    })
    return
  }
  
  try {
    // Prepare data for PATCH request
    const data = {
      [props.fieldName]: internalValue.value
    }
    
    // Make API PATCH request
    const response = await fetch(`${props.apiEndpoint}/${props.uuid}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }
    
    // Update original value after successful update
    originalValue.value = internalValue.value
    valueChanged.value = false
    isEditing.value = false
    
    // Emit success event
    emit('field-updated', {
      success: true,
      fieldName: props.fieldName,
      value: internalValue.value
    })
  } catch (error) {
    console.error('Error updating field:', error)
    emit('field-updated', {
      success: false,
      fieldName: props.fieldName,
      value: internalValue.value,
      error: error.message
    })
  }
}

const cancelChange = () => {
  // Reset to original value
  internalValue.value = originalValue.value
  emit('update:modelValue', originalValue.value)
  
  // Reset states
  isEditing.value = false
  valueChanged.value = false
  
  // Emit cancel event
  emit('field-change-cancelled', {
    fieldName: props.fieldName,
    originalValue: originalValue.value
  })
}
</script>
