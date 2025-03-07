<template>
  <div 
    :class="[
      's-select-field', 
      { 
        's-select-field--editing': isEditing && valueChanged,
        's-select-field--loading': isLoading
      }
    ]"
  >
    <label 
      v-if="label" 
      :class="[
        's-select-field__label',
        { 's-select-field__label--required': required }
      ]"
    >
      {{ label }}
    </label>
    
    <div class="s-select-field__input-container">
      <select
        :value="modelValue"
        @change="handleChange"
        @focus="onFocus"
        @blur="onBlur"
        @click="loadOptions"
        :disabled="disabled || isLoading"
        :class="[
          's-select-field__select',
          { 's-select-field__select--error': error }
        ]"
      >
        <option value="" disabled>{{ placeholder || 'Select an option' }}</option>
        <option 
          v-for="option in options" 
          :key="option.value" 
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      
      <div v-if="isLoading" class="s-select-field__loading"></div>
      
      <div class="s-select-field__actions">
        <template v-if="editMode && isEditing && valueChanged">
          <button 
            type="button" 
            class="s-select-field__action-btn s-select-field__action-btn--confirm"
            @click="confirmChange"
            title="Confirm"
          >
            <svg class="s-select-field__action-icon" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path>
            </svg>
          </button>
          <button 
            type="button" 
            class="s-select-field__action-btn s-select-field__action-btn--cancel"
            @click="cancelChange"
            title="Cancel"
          >
            <svg class="s-select-field__action-icon" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path>
            </svg>
          </button>
        </template>
        <slot name="actions" v-else></slot>
      </div>
      
      <span v-if="error" class="s-select-field__error">{{ error }}</span>
      <span v-else-if="helperText" class="s-select-field__helper">{{ helperText }}</span>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue'
import '@/assets/styles/sSelectField.css'
import apiService from '@/services/apiService'

const isEditing = ref(false)
const isLoading = ref(false)
const options = ref([])
const internalValue = ref('')
const originalValue = ref('')
const valueChanged = ref(false)
const optionsLoaded = ref(false)

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
  optionsEndpoint: {
    type: String,
    required: true
  },
  editMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'field-updated', 'field-change-cancelled', 'options-loaded'])

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  originalValue.value = newValue
  internalValue.value = newValue
})

// Initialize values
internalValue.value = props.modelValue
originalValue.value = props.modelValue

const loadOptions = async () => {
  // Only load options once or if they haven't been loaded yet
  if (optionsLoaded.value) return
  
  isLoading.value = true
  
  try {
    const data = await apiService.get(props.optionsEndpoint)
    
    // Assuming the API returns an array of objects with value and label properties
    // If the API returns a different format, you may need to transform the data here
    options.value = Array.isArray(data) ? data : []
    
    optionsLoaded.value = true
    emit('options-loaded', options.value)
  } catch (error) {
    console.error('Error loading options:', error)
    options.value = []
  } finally {
    isLoading.value = false
  }
}

const handleChange = (event) => {
  const value = event.target.value
  
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
    console.error('UUID or API endpoint not provided for field update')
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
    
    await apiService.put(`${props.apiEndpoint}/${props.uuid}`, data)
    
    // Update original value to match the new value
    originalValue.value = internalValue.value
    valueChanged.value = false
    
    // Emit success event
    emit('field-updated', {
      success: true,
      fieldName: props.fieldName,
      value: internalValue.value
    })
  } catch (error) {
    console.error('Error updating field:', error)
    
    // Emit error event
    emit('field-updated', {
      success: false,
      fieldName: props.fieldName,
      value: internalValue.value,
      error: error.message
    })
  } finally {
    isEditing.value = false
  }
}

const cancelChange = () => {
  // Reset to original value
  internalValue.value = originalValue.value
  emit('update:modelValue', originalValue.value)
  
  // Reset state
  valueChanged.value = false
  isEditing.value = false
  
  // Emit cancel event
  emit('field-change-cancelled', {
    fieldName: props.fieldName,
    originalValue: originalValue.value
  })
}
</script>
