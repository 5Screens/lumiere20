<template>
  <div class="ci-type-target-selector">
    <!-- Select dropdown for CI types (excluding MODELS category) -->
    <Select
      v-model="localValue"
      :options="filteredCiTypes"
      optionLabel="label"
      optionValue="uuid"
      :placeholder="$t('common.select')"
      :disabled="disabled"
      :loading="loading"
      fluid
      @change="onChange"
    >
      <template #value="slotProps">
        <div v-if="slotProps.value" class="flex items-center gap-2">
          <i v-if="getSelectedType?.icon" :class="['pi', getSelectedType.icon]" />
          <span>{{ getSelectedType?.label }}</span>
        </div>
        <span v-else>{{ slotProps.placeholder }}</span>
      </template>
      <template #option="slotProps">
        <div class="flex items-center gap-2">
          <i v-if="slotProps.option.icon" :class="['pi', slotProps.option.icon]" />
          <span>{{ slotProps.option.label }}</span>
        </div>
      </template>
    </Select>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Select from 'primevue/select'
import ciTypesService from '@/services/ciTypesService'

const props = defineProps({
  modelValue: {
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
const localValue = ref(null)
const loading = ref(false)
const ciTypes = ref([])

/**
 * Filter CI types to exclude those with MODELS category
 */
const filteredCiTypes = computed(() => {
  return ciTypes.value.filter(ct => ct.categoryCode !== 'MODELS')
})

/**
 * Get the currently selected type for display
 */
const getSelectedType = computed(() => {
  return filteredCiTypes.value.find(ct => ct.uuid === localValue.value)
})

/**
 * Load all CI types
 */
const loadCiTypes = async () => {
  try {
    loading.value = true
    const data = await ciTypesService.getAll()
    ciTypes.value = data.map(ct => ({
      uuid: ct.uuid,
      code: ct.code,
      label: ct._translations?.label?.[locale.value] || ct.label,
      icon: ct.icon,
      categoryCode: ct.category?.code || null
    }))
  } catch (error) {
    console.error('Failed to load CI types:', error)
    ciTypes.value = []
  } finally {
    loading.value = false
  }
}

const onChange = () => {
  emit('update:modelValue', localValue.value)
}

// Initialize
onMounted(async () => {
  await loadCiTypes()
  localValue.value = props.modelValue
})

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

// Reload labels when locale changes
watch(locale, () => {
  loadCiTypes()
})
</script>
