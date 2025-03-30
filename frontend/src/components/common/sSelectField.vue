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
    type: String,
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
    type: String,
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
const touched = ref(false)

// Computed properties
const showError = computed(() => {
  console.info('SSelectField showError debug:');
  console.info('- props.required:', props.required);
  console.info('- touched.value:', touched.value);
  console.info('- !selectedValue.value:', !selectedValue.value);
  console.info('- selectedValue.value:', selectedValue.value);
  return props.required && touched.value && (!selectedValue.value || selectedValue.value === '')
})

// Watch modelValue changes
watch(() => props.modelValue, (newValue) => {
  console.info('modelValue changed to:', newValue)
  if (newValue !== undefined && newValue !== null) {
    selectedValue.value = newValue
    originalValue.value = newValue
  }
})

// Methods
const fetchOptions = async () => {
  if (optionsLoaded.value) {
    console.info('Options already loaded, skipping fetch')
    return
  }

  // Utiliser endpoint en priorité, sinon optionsEndpoint pour la rétrocompatibilité
  const apiEndpoint = props.endpoint
  
  console.info('Fetching options from endpoint:', apiEndpoint)
  try {
    loadingOptions.value = true
    const response = await apiService.get(apiEndpoint)
    console.info('Successfully fetched options:', response)
    options.value = response
    optionsLoaded.value = true
  } catch (error) {
    console.error('Error loading options:', error)
    console.warn('Failed to load options from endpoint:', apiEndpoint)
    emit('error', 'Failed to load options')
  } finally {
    console.info('Options loading state set to:', loadingOptions.value)
    loadingOptions.value = false
  }
}

const handleChange = () => {
  touched.value = true
  if (props.mode === 'edition' && selectedValue.value !== originalValue.value) {
    editing.value = true
  }
  emit('update:modelValue', selectedValue.value)
  emit('change', selectedValue.value)
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
    const data = {
      [fieldName]: selectedValue.value
    }
    
    await apiService.patch(endpointWithUuid, data)
    
    originalValue.value = selectedValue.value
    editing.value = false
    emit('update:success', {
      success: true,
      value: selectedValue.value
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
  console.info('SSelectField mounted with props:', {
    modelValue: props.modelValue,
    mode: props.mode,
    uuid: props.uuid,
    endpoint: props.endpoint,
    fieldName: props.fieldName
  })

  if (props.modelValue) {
    selectedValue.value = props.modelValue
    originalValue.value = props.modelValue
  }

  fetchOptions()
  
  // Marquer comme touché si le champ est requis et vide au montage
  if (props.required && (!selectedValue.value || selectedValue.value === '')) {
    touched.value = true
  }
})
</script>

<style scoped>
/* Styles are imported from sSelectField.css */
</style>
