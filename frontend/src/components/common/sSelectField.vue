<template>
  <div class="s-select-field" :class="{ 'editing': editing, 'has-error': showError }">
    <div class="s-select-field__label-container" v-if="label">
      <label class="s-select-field__label" :class="{ 's-select-field__label--required': required }">
        {{ label }}
      </label>
    </div>
    
    <div class="s-select-field__input-container">
      <select
        v-model="selectedValue"
        @change="handleChange"
        :disabled="loadingOptions"
      >
        <option value="" disabled>{{ loadingOptions ? t('common.loading') : t('common.selectOption') }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <div v-if="loadingOptions" class="spinner" :aria-label="t('common.loading_in_progress')"></div>

      <div v-if="editing && mode === 'edition'" class="s-select-field__actions">
        <RgButton
          @confirm="confirmChange"
          @cancel="handleCancelEdit"
          :disabled="isUpdating"
        />
      </div>
      
      <div v-if="showError" class="s-select-field__error-message">
        {{ t('errors.selectOneRow') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import '@/assets/styles/sSelectField.css'
import apiService from '@/services/apiService'
import RgButton from './rgButton.vue'

// Props definition
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  mode: {
    type: String,
    required: true,
    validator: value => ['creation', 'edition'].includes(value)
  },
  initialValue: {
    type: String,
    default: ''
  },
  uuid: {
    type: String,
    required: false
  },
  endpoint: {
    type: [String, Function],
    required: true
  },
  patchEndpoint: {
    type: String,
    required: false
  },
  label: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  fieldName: {
    type: String,
    default: 'entity_type'
  }
})

// Emits definition
const emit = defineEmits(['update:modelValue', 'change', 'update:success', 'update:error', 'update:cancelled', 'error'])

// Composables
const { t } = useI18n()

// Reactive state
const options = ref([])
const selectedValue = ref(props.modelValue)
const originalValue = ref(props.modelValue)
const loadingOptions = ref(false)
const editing = ref(false)
const isUpdating = ref(false)
const optionsLoaded = ref(false)

// Computed properties
const showError = computed(() => {
  return props.required && (!selectedValue.value || selectedValue.value === '')
})

// Watch modelValue changes
watch(() => props.modelValue, (newValue) => {
  console.info('[sSelectField] modelValue changed to:', newValue)
  if (newValue !== undefined && newValue !== null) {
    if (typeof newValue === 'number') {
      selectedValue.value = Number(newValue)
    } else {
      selectedValue.value = newValue
    }
    originalValue.value = newValue
  }
})

// Watch endpoint changes
watch(() => props.endpoint, (newEndpoint, oldEndpoint) => {
  console.info('[sSelectField] endpoint changed from:', oldEndpoint, 'to:', newEndpoint)
  if (newEndpoint !== oldEndpoint) {
    optionsLoaded.value = false
    options.value = []
    fetchOptions()
  }
})

// Methods
const fetchOptions = async () => {
  if (optionsLoaded.value) {
    console.info('Options already loaded, skipping fetch')
    return
  }

  if (!props.endpoint) {
    console.info('No endpoint provided, skipping fetch')
    return
  }

  try {
    loadingOptions.value = true
    let response
    
    if (typeof props.endpoint === 'function') {
      response = await props.endpoint()
    } else {
      response = await apiService.get(props.endpoint)
    }
    
    options.value = response
    optionsLoaded.value = true
  } catch (error) {
    console.error('Error loading options:', error)
    console.warn('Failed to load options from endpoint:', props.endpoint)
    emit('error', 'Failed to load options')
  } finally {
    loadingOptions.value = false
  }
}

const handleChange = () => {
  if (props.mode === 'edition' && selectedValue.value !== originalValue.value) {
    editing.value = true
  }
  
  // Convertir en nombre si la valeur est numérique
  let emitValue = selectedValue.value
  if (selectedValue.value !== '' && !isNaN(selectedValue.value)) {
    emitValue = Number(selectedValue.value)
  }
  
  emit('update:modelValue', emitValue)
  emit('change', emitValue)
}

const confirmChange = async () => {
  if (!props.uuid || !props.patchEndpoint) {
    console.error('Missing uuid or patchEndpoint for edit mode')
    emit('update:error', {
      success: false,
      error: 'Missing uuid or patchEndpoint'
    })
    return
  }

  try {
    isUpdating.value = true
    const fieldName = props.fieldName || 'entity_type'
    const endpointWithUuid = `${props.patchEndpoint}/${props.uuid}`
    
    // Convertir en nombre si la valeur est numérique
    let valueToSend = selectedValue.value
    if (valueToSend !== '' && !isNaN(valueToSend)) {
      valueToSend = Number(valueToSend)
    }
    
    const data = {
      [fieldName]: valueToSend
    }
    
    await apiService.patch(endpointWithUuid, data)
    
    originalValue.value = selectedValue.value
    editing.value = false
    emit('update:success', {
      success: true,
      value: valueToSend
    })
  } catch (error) {
    console.error('Error updating value:', error)
    selectedValue.value = originalValue.value
    editing.value = false
    emit('update:error', {
      success: false,
      value: selectedValue.value,
      error: error.message
    })
  } finally {
    isUpdating.value = false
  }
}

const handleCancelEdit = () => {
  selectedValue.value = originalValue.value
  editing.value = false
  emit('update:cancelled')
}

// Lifecycle hooks
onMounted(() => {
  fetchOptions()
})
</script>

<style scoped>
/* Styles are imported from sSelectField.css */
</style>
