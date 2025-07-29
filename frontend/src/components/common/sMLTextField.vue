<template>
  <div 
    :class="[
      's-ml-text-field',
      { 's-ml-text-field--editing': hasEditingFields }
    ]"
  >
    <label v-if="global_label" class="s-ml-text-field__label">
      {{ global_label }}
      <span v-if="required" class="s-ml-text-field__required">*</span>
    </label>
    
    <div 
      :class="[
        's-ml-text-field__container',
        { 's-ml-text-field__container--required': required && !hasValues }
      ]"
    >
      <div 
        v-for="lang in activeLanguages" 
        :key="lang.code" 
        class="s-ml-text-field__input-group"
      >
        <div 
          :class="[
            's-ml-text-field__flag',
            { 's-ml-text-field__flag--required': required && !getValueForLanguage(lang.code) }
          ]"
        >
          {{ getFlagEmoji(lang.code) }}
        </div>
        
        <input
          type="text"
          :class="[
            's-ml-text-field__input',
            { 's-ml-text-field__input--editing': editingStates[lang.code]?.isEditing }
          ]"
          :value="getValueForLanguage(lang.code)"
          @input="handleInput(lang.code, $event.target.value)"
          @focus="onFocus(lang.code)"
          @blur="onBlur(lang.code)"
          :disabled="disabled"
          :required="required"
          :placeholder="lang.label"
        />
        
        <div 
          v-if="editingStates[lang.code]?.isEditing && editingStates[lang.code]?.valueChanged && patchendpoint" 
          class="s-ml-text-field__actions"
        >
          <RgButton
            @confirm="confirmChange(lang.code)"
            @cancel="cancelChange(lang.code)"
            :disabled="disabled || editingStates[lang.code]?.isUpdating"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import RgButton from './rgButton.vue'
import apiService from '@/services/apiService'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  global_label: {
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
  patchendpoint: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'update:success', 'field-change-cancelled'])

// Reactive states
const activeLanguages = ref([])
const editingStates = reactive({})
const originalValues = reactive({})

// Computed properties
const hasValues = computed(() => {
  return props.modelValue && props.modelValue.length > 0 && 
         props.modelValue.some(item => item.label && item.label.trim() !== '')
})

const hasEditingFields = computed(() => {
  return Object.values(editingStates).some(state => state?.isEditing)
})

// Methods
const getFlagEmoji = (langCode) => {
  if (langCode.length !== 2) return '🌐'
  
  const codePoints = langCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  
  return String.fromCodePoint(...codePoints)
}

const getValueForLanguage = (langCode) => {
  const item = props.modelValue?.find(item => item.label_lang_code === langCode)
  return item?.label || ''
}

const getUuidForLanguage = (langCode) => {
  const item = props.modelValue?.find(item => item.label_lang_code === langCode)
  return item?.label_uuid || null
}

const initializeEditingState = (langCode) => {
  if (!editingStates[langCode]) {
    editingStates[langCode] = {
      isEditing: false,
      valueChanged: false,
      isUpdating: false
    }
  }
}

const handleInput = (langCode, value) => {
  initializeEditingState(langCode)
  
  // Update modelValue
  const updatedValue = [...(props.modelValue || [])]
  const existingIndex = updatedValue.findIndex(item => item.label_lang_code === langCode)
  
  if (existingIndex >= 0) {
    updatedValue[existingIndex] = {
      ...updatedValue[existingIndex],
      label: value
    }
  } else {
    updatedValue.push({
      label_uuid: null,
      label_lang_code: langCode,
      label: value
    })
  }
  
  emit('update:modelValue', updatedValue)
  
  // Update editing state if in edit mode
  if (patchendpoint.value) {
    const originalValue = originalValues[langCode] || ''
    editingStates[langCode].valueChanged = value !== originalValue
  }
}

const onFocus = (langCode) => {
  initializeEditingState(langCode)
  
  if (props.patchendpoint) {
    editingStates[langCode].isEditing = true
    
    // Store original value if not already stored
    if (!(langCode in originalValues)) {
      originalValues[langCode] = getValueForLanguage(langCode)
    }
  }
}

const onBlur = (langCode) => {
  // Keep editing state for button interaction
}

const confirmChange = async (langCode) => {
  const uuid = getUuidForLanguage(langCode)
  const newValue = getValueForLanguage(langCode)
  
  if (!uuid || !props.patchendpoint) {
    console.error('Missing UUID or patch endpoint for confirmation')
    return
  }
  
  editingStates[langCode].isUpdating = true
  
  try {
    const response = await apiService.patch(`${props.patchendpoint}/${uuid}`, {
      label: newValue
    })
    
    // Update original value and reset editing state
    originalValues[langCode] = newValue
    editingStates[langCode].isEditing = false
    editingStates[langCode].valueChanged = false
    editingStates[langCode].isUpdating = false
    
    emit('update:success', {
      success: true,
      fieldName: `label_${langCode}`,
      value: newValue,
      error: null
    })
    
  } catch (error) {
    console.error('Error updating field:', error)
    editingStates[langCode].isUpdating = false
    
    emit('update:success', {
      success: false,
      fieldName: `label_${langCode}`,
      value: newValue,
      error: error.message || 'Update failed'
    })
  }
}

const cancelChange = (langCode) => {
  const originalValue = originalValues[langCode] || ''
  
  // Restore original value
  const updatedValue = [...(props.modelValue || [])]
  const existingIndex = updatedValue.findIndex(item => item.label_lang_code === langCode)
  
  if (existingIndex >= 0) {
    updatedValue[existingIndex] = {
      ...updatedValue[existingIndex],
      label: originalValue
    }
  }
  
  emit('update:modelValue', updatedValue)
  
  // Reset editing state
  editingStates[langCode].isEditing = false
  editingStates[langCode].valueChanged = false
  editingStates[langCode].isUpdating = false
  
  emit('field-change-cancelled', {
    fieldName: `label_${langCode}`,
    originalValue: originalValue
  })
}

// Initialize component
const loadActiveLanguages = async () => {
  try {
    const response = await apiService.get('languages?is_active=yes')
    activeLanguages.value = response || []
    
    // Initialize editing states for all languages
    activeLanguages.value.forEach(lang => {
      initializeEditingState(lang.code)
    })
    
    // Store original values if in edit mode
    if (props.patchendpoint) {
      activeLanguages.value.forEach(lang => {
        originalValues[lang.code] = getValueForLanguage(lang.code)
      })
    }
    
  } catch (error) {
    console.error('Error loading active languages:', error)
    activeLanguages.value = []
  }
}

onMounted(() => {
  loadActiveLanguages()
})
</script>

<style scoped>
@import '@/assets/styles/sMLTextField.css';
</style>
