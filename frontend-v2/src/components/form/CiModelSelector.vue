<template>
  <div class="ci-model-selector">
    <!-- Trigger button showing selected model -->
    <Button
      type="button"
      severity="secondary"
      outlined
      class="w-full justify-start"
      :disabled="disabled || !ciTypeCode"
      @click="openDialog"
    >
      <template #default>
        <div v-if="selectedModel" class="flex items-center gap-2">
          <i class="pi pi-box" />
          <span>{{ selectedModel.name }}</span>
          <Tag 
            v-if="selectedModel.extended_core_fields?.manufacturer" 
            :value="selectedModel.extended_core_fields.manufacturer" 
            severity="secondary"
            class="text-xs ml-auto"
          />
        </div>
        <span v-else class="text-surface-400">
          {{ $t('common.selectModel') }}
        </span>
      </template>
    </Button>

    <!-- Model Picker Dialog -->
    <CiModelPicker
      v-model="localValue"
      v-model:show="dialogVisible"
      :ciTypeCode="ciTypeCode"
      :title="$t('common.selectModel')"
      @confirm="onConfirm"
      @cancel="dialogVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { CiModelPicker } from '@/components/pickers'
import configurationItemsService from '@/services/configurationItemsService'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  ciTypeCode: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const { locale } = useI18n()
const dialogVisible = ref(false)
const localValue = ref(null)
const selectedModel = ref(null)
const modelsCache = ref([])

/**
 * Load model details for display
 */
const loadSelectedModel = async () => {
  if (!props.modelValue) {
    selectedModel.value = null
    return
  }
  
  try {
    // First check cache
    const cached = modelsCache.value.find(m => m.uuid === props.modelValue)
    if (cached) {
      selectedModel.value = cached
      return
    }
    
    // Load from API
    const model = await configurationItemsService.getByUuid(props.modelValue)
    selectedModel.value = model
  } catch (error) {
    console.error('Failed to load model:', error)
    selectedModel.value = null
  }
}

/**
 * Load models for cache (used when picker opens)
 */
const loadModels = async () => {
  if (!props.ciTypeCode) return
  
  try {
    modelsCache.value = await configurationItemsService.getModelsForType(props.ciTypeCode, locale.value)
  } catch (error) {
    console.error('Failed to load models:', error)
  }
}

const openDialog = () => {
  localValue.value = props.modelValue
  loadModels()
  dialogVisible.value = true
}

const onConfirm = (value) => {
  emit('update:modelValue', value)
  dialogVisible.value = false
  
  // Update selected model display
  if (value) {
    const model = modelsCache.value.find(m => m.uuid === value)
    if (model) {
      selectedModel.value = model
    } else {
      loadSelectedModel()
    }
  } else {
    selectedModel.value = null
  }
}

// Load selected model on mount
onMounted(() => {
  if (props.modelValue) {
    loadSelectedModel()
  }
})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal) => {
  if (newVal !== localValue.value) {
    loadSelectedModel()
  }
})

// Reload when ciTypeCode changes
watch(() => props.ciTypeCode, () => {
  // Clear selection if type changes
  if (props.modelValue) {
    emit('update:modelValue', null)
    selectedModel.value = null
  }
  modelsCache.value = []
})

// Reload when locale changes
watch(locale, () => {
  if (props.modelValue) {
    loadSelectedModel()
  }
})
</script>
