<template>
  <div 
    :class="[
      's-text-field', 
      { 's-text-field--editing': isEditing,
        's-text-field--error': showRequiredError }
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
          { 's-text-field__input--error': error || showRequiredError }
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
      
      <span v-if="showRequiredError" class="s-text-field__error">{{ t('errors.requiredField') }}</span>
      <span v-else-if="error" class="s-text-field__error">{{ error }}</span>
      <span v-else-if="helperText" class="s-text-field__helper">{{ helperText }}</span>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import RgButton from './rgButton.vue'
import apiService from '@/services/apiService'
import '@/assets/styles/sTextField.css'

const { t } = useI18n()
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
    type: [String, Number, null],
    default: null
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

// Computed property to check if field is required and empty
const showRequiredError = computed(() => {
  return props.required &&  
    (props.modelValue === '' || props.modelValue === null || props.modelValue === undefined)
})

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
    // Prepare the endpoint with UUID
    const endpointWithUuid = `${props.apiEndpoint}/${props.uuid}`
    
    // Prepare the data object for PATCH request
    const data = {
      [props.fieldName]: internalValue.value
    }
    
    // Use apiService to make the PATCH request
    const response = await apiService.patch(endpointWithUuid, data)
    
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
