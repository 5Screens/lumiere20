<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="title || $t('common.selectModel')"
    :style="{ width: '90vw', maxWidth: '700px', height: 'auto', maxHeight: '80vh' }"
    :draggable="false"
    @hide="onCancel"
  >
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- No models available -->
    <div v-else-if="models.length === 0" class="flex flex-col items-center justify-center py-8 text-surface-500">
      <i class="pi pi-inbox text-4xl mb-4" />
      <p>{{ $t('common.noModelsAvailable') }}</p>
    </div>

    <!-- Models list -->
    <div v-else class="flex flex-col gap-2 max-h-96 overflow-y-auto">
      <button
        v-for="model in models"
        :key="model.uuid"
        type="button"
        class="model-item p-4 rounded-lg border-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer flex flex-col gap-1 text-left"
        :class="localValue === model.uuid ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-500 ring-2 ring-primary-500/30' : 'border-surface-200 dark:border-surface-700'"
        @click="localValue = model.uuid"
      >
        <div class="flex items-center justify-between">
          <span class="font-semibold">{{ model.name }}</span>
          <Tag 
            v-if="model.extended_core_fields?.manufacturer" 
            :value="model.extended_core_fields.manufacturer" 
            severity="secondary"
            class="text-xs"
          />
        </div>
        <span v-if="model.description" class="text-sm text-surface-500 line-clamp-2">
          {{ model.description }}
        </span>
        <div v-if="model.extended_core_fields" class="flex flex-wrap gap-2 mt-2 text-xs text-surface-500">
          <span v-if="model.extended_core_fields.manufacturer_reference">
            <i class="pi pi-tag mr-1" />{{ model.extended_core_fields.manufacturer_reference }}
          </span>
          <span v-if="model.extended_core_fields.form_factor">
            <i class="pi pi-box mr-1" />{{ model.extended_core_fields.form_factor }}
          </span>
          <span v-if="model.extended_core_fields.estimated_unit_cost">
            <i class="pi pi-euro mr-1" />{{ model.extended_core_fields.estimated_unit_cost }}
          </span>
        </div>
      </button>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button :label="$t('common.clear')" severity="secondary" text @click="localValue = null" />
        <Button :label="$t('common.cancel')" severity="secondary" @click="onCancel" />
        <Button :label="$t('common.confirm')" @click="onConfirm" :disabled="loading" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import configurationItemsService from '@/services/configurationItemsService'

const { locale } = useI18n()

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  show: {
    type: Boolean,
    default: false
  },
  ciTypeCode: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'update:show', 'confirm', 'cancel'])

const localValue = ref(null)
const initialValue = ref(null)
const loading = ref(false)
const models = ref([])

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

// Load models when dialog opens
watch(() => props.show, async (newVal) => {
  if (newVal) {
    localValue.value = props.modelValue
    initialValue.value = props.modelValue
    await loadModels()
  }
})

// Reload models when ciTypeCode changes
watch(() => props.ciTypeCode, async (newVal, oldVal) => {
  if (newVal && newVal !== oldVal && props.show) {
    await loadModels()
  }
})

const loadModels = async () => {
  if (!props.ciTypeCode) {
    models.value = []
    return
  }
  
  try {
    loading.value = true
    models.value = await configurationItemsService.getModelsForType(props.ciTypeCode, locale.value)
  } catch (error) {
    console.error('Failed to load models:', error)
    models.value = []
  } finally {
    loading.value = false
  }
}

const onConfirm = () => {
  // Skip if no change
  if (localValue.value === initialValue.value) {
    visible.value = false
    return
  }
  emit('update:modelValue', localValue.value)
  emit('confirm', localValue.value)
}

const onCancel = () => {
  visible.value = false
  emit('cancel')
}
</script>
