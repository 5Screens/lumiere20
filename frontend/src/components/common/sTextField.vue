<template>
  <div 
    :class="[
      's-text-field', 
      { 's-text-field--editing': isEditing }
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
      
      <div v-if="isEditing && valueChanged && editMode" class="s-text-field__actions">
        <RgButton
          @confirm="confirmChange"
          @cancel="cancelChange"
          :disabled="disabled"
        />
      </div>
      
      <!-- Debug info -->
      <div v-if="false" class="s-text-field__debug" style="font-size: 10px; color: #666; margin-top: 4px;">
        Debug: isEditing={{ isEditing }}, valueChanged={{ valueChanged }}, editMode={{ editMode }}
      </div>
      
      <span v-if="error" class="s-text-field__error">{{ error }}</span>
      <span v-else-if="helperText" class="s-text-field__helper">{{ helperText }}</span>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue'
import RgButton from './rgButton.vue'
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
  },
  editMode: {
    type: Boolean,
    default: false
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
