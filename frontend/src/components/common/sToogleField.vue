<template>
  <div class="s-toogle-field" :class="{ 's-toogle-field--editing': isEditing }">
    <div class="s-toogle-field__label-container">
      <label :for="uuid" class="s-toogle-field__label" :class="{ 's-toogle-field__label--required': required }">
        {{ label }}
      </label>
    </div>

    <div class="s-toogle-field__input-container">
      <label class="s-toogle-field__switch">
        <input
          type="checkbox"
          :id="uuid"
          v-model="localValue"
          :disabled="disabled"
          @change="handleChange"
        >
        <span class="s-toogle-field__slider"></span>
      </label>
      
      <span class="s-toogle-field__value-text">
        {{ localValue ? t('common.yes') : t('common.no') }}
      </span>

      <!-- Actions buttons in edit mode -->
      <div v-if="mode === 'edit' && isEditing" class="s-toogle-field__actions">
        <RgButton
          @confirm="handleConfirm"
          @cancel="handleCancel"
          :disabled="disabled"
        />
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="s-toogle-field__error">
      {{ error }}
    </div>

    <!-- Helper text -->
    <div v-if="helper && !error" class="s-toogle-field__helper">
      {{ helper }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import RgButton from '@/components/common/rgButton.vue'
import apiService from '@/services/apiService'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'edit'].includes(value)
  },
  uuid: {
    type: String,
    required: false
  },
  patchEndpoint: {
    type: String,
    required: false
  },
  fieldName: {
    type: String,
    required: false
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  helper: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:success', 'update:error'])

// Composables
const { t } = useI18n()

// State
const localValue = ref(props.modelValue)
const originalValue = ref(props.modelValue)
const isEditing = ref(false)
const error = ref('')

// Computed
const valueChanged = computed(() => localValue.value !== originalValue.value)

// Watchers
watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue
  originalValue.value = newValue
})

// Methods
const handleChange = () => {
  if (props.mode === 'create') {
    emit('update:modelValue', localValue.value)
  } else {
    isEditing.value = true
  }
}

const handleConfirm = async () => {
  if (!props.uuid || !props.patchEndpoint) {
    console.error('UUID or patch endpoint not provided')
    return
  }

  try {
    // Prepare the endpoint with UUID
    const endpointWithUuid = `${props.patchEndpoint}/${props.uuid}`
    
    // Prepare the data object for PATCH request
    const data = {
      [props.fieldName || 'value']: localValue.value
    }
    
    // Use apiService to make the PATCH request
    await apiService.patch(endpointWithUuid, data)

    originalValue.value = localValue.value
    isEditing.value = false
    error.value = ''
    emit('update:modelValue', localValue.value)
    emit('update:success')
  } catch (err) {
    error.value = t('errors.update_failed')
    emit('update:error', err)
  }
}

const handleCancel = () => {
  localValue.value = originalValue.value
  isEditing.value = false
  error.value = ''
}
</script>

<style scoped>
@import '@/assets/styles/sToogleField.css';
</style>
