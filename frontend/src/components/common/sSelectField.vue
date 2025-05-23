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
          :key="props.valueField ? option[props.valueField] : option.value"
          :value="props.valueField ? option[props.valueField] : option.value"
        >
          {{ option[props.displayField] }}
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
  },
  valueField: {
    type: String,
    default: ''
  },
  displayField: {
    type: String,
    default: 'label'
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
    // Only update originalValue if we're not currently editing
    if (!editing.value) {
      console.info('[sSelectField] Updating originalValue from watch:', newValue)
      originalValue.value = newValue
    } else {
      console.info('[sSelectField] Skipping originalValue update - currently editing')
    }
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
    
    // Vérifier si la valeur actuelle existe dans les options après le chargement
    if (selectedValue.value) {
      const valueField = props.valueField || 'value'
      const optionExists = options.value.some(option => 
        option[valueField] === selectedValue.value ||
        (typeof selectedValue.value === 'number' && option[valueField] === Number(selectedValue.value)) ||
        (typeof option[valueField] === 'number' && Number(selectedValue.value) === option[valueField])
      )
      
      if (!optionExists) {
        console.warn(`Selected value ${selectedValue.value} not found in options using field ${valueField}`)
      }
    }
  } catch (error) {
    console.error('Error loading options:', error)
    console.warn('Failed to load options from endpoint:', props.endpoint)
    emit('error', 'Failed to load options')
  } finally {
    loadingOptions.value = false
  }
}

const handleChange = () => {
  // Capture original value when starting to edit
  if (props.mode === 'edition' && !editing.value) {
    originalValue.value = props.modelValue
    console.info('[sSelectField] handleChange - Captured original value:', originalValue.value)
  }
  
  if (props.mode === 'edition' && selectedValue.value !== originalValue.value) {
    editing.value = true
  }
  
  // Convertir en nombre si la valeur est numérique
  let emitValue = selectedValue.value
  if (selectedValue.value !== '' && !isNaN(selectedValue.value)) {
    emitValue = Number(selectedValue.value)
  }
  
  // Si une option est sélectionnée et que nous avons un valueField personnalisé,
  // nous pouvons émettre la valeur complète de l'option pour les composants parents
  // qui pourraient avoir besoin d'autres propriétés
  const selectedOption = selectedValue.value ? 
    options.value.find(option => {
      const optionValue = props.valueField ? option[props.valueField] : option.value;
      return optionValue === selectedValue.value || 
        (typeof selectedValue.value === 'number' && optionValue === Number(selectedValue.value)) ||
        (typeof optionValue === 'number' && Number(selectedValue.value) === optionValue);
    }) : null;
  
  emit('update:modelValue', emitValue)
  emit('change', emitValue, selectedOption)
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
  console.info('[sSelectField] handleCancelEdit called')
  console.info('[sSelectField] Current selected value:', selectedValue.value)
  console.info('[sSelectField] Original value to restore:', originalValue.value)
  
  selectedValue.value = originalValue.value
  console.info('[sSelectField] Value reset to original:', selectedValue.value)
  
  console.info('[sSelectField] Before state reset - editing:', editing.value)
  editing.value = false
  console.info('[sSelectField] After state reset - editing:', editing.value)
  
  emit('update:cancelled')
  console.info('[sSelectField] handleCancelEdit completed')
}

// Lifecycle hooks
onMounted(() => {
  fetchOptions()
})
</script>

<style scoped>
/* Styles are imported from sSelectField.css */
</style>
