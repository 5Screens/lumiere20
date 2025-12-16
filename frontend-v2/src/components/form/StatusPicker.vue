<template>
  <div class="status-picker">
    <Select 
      v-model="selectedStatus" 
      :options="statusOptions" 
      optionLabel="label"
      optionValue="uuid"
      :placeholder="$t('workflow.noWorkflow')"
      :disabled="disabled || statusOptions.length === 0"
      class="w-full"
      :pt="{
        root: { class: 'status-picker-select' }
      }"
    >
      <!-- Current value display -->
      <template #value="slotProps">
        <div v-if="currentStatus" class="flex items-center gap-2">
          <span 
            class="status-badge"
            :style="{ backgroundColor: currentStatus.category?.color || '#6b7280' }"
          >
            {{ currentStatusLabel }}
          </span>
          <i class="pi pi-chevron-down text-xs text-surface-400" />
        </div>
        <span v-else class="text-surface-400 italic">
          {{ $t('workflow.noWorkflow') }}
        </span>
      </template>

      <!-- Dropdown header -->
      <template #header>
        <div class="font-medium px-3 py-2 text-sm text-surface-500 border-b border-surface-200 dark:border-surface-700">
          {{ $t('workflow.transitionTo') }}
        </div>
      </template>

      <!-- Option template -->
      <template #option="slotProps">
        <div class="flex items-center justify-between w-full gap-3 py-1">
          <div class="flex items-center gap-2">
            <span class="text-surface-500">{{ slotProps.option.transitionName }}</span>
            <i class="pi pi-arrow-right text-xs text-surface-400" />
          </div>
          <span 
            class="status-badge"
            :style="{ backgroundColor: slotProps.option.color || '#6b7280' }"
          >
            {{ slotProps.option.label }}
          </span>
        </div>
      </template>

      <!-- Dropdown icon -->
      <template #dropdownicon>
        <span></span>
      </template>
    </Select>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Select from 'primevue/select'

const { locale } = useI18n()

// Props
const props = defineProps({
  // Current status object
  currentStatus: {
    type: Object,
    default: null
  },
  // Available transitions array
  availableTransitions: {
    type: Array,
    default: () => []
  },
  // Disabled state
  disabled: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['transition'])

// Local state for select (we don't actually use this value, just trigger on change)
const selectedStatus = computed({
  get: () => props.currentStatus?.uuid || null,
  set: (newUuid) => {
    if (newUuid && newUuid !== props.currentStatus?.uuid) {
      const transition = props.availableTransitions.find(t => t.to_status_uuid === newUuid)
      if (transition) {
        emit('transition', transition)
      }
    }
  }
})

// Current status label with translation
const currentStatusLabel = computed(() => {
  if (!props.currentStatus) return ''
  // Use translated name if available
  if (props.currentStatus._translations?.name?.[locale.value]) {
    return props.currentStatus._translations.name[locale.value]
  }
  return props.currentStatus.name || ''
})

// Transform transitions to select options
const statusOptions = computed(() => {
  return props.availableTransitions.map(t => ({
    uuid: t.to_status_uuid,
    label: t.to_status_name || t.to_status?.name || '',
    transitionName: t.name || '',
    color: t.to_status?.category?.color || t.to_status_color || '#6b7280'
  }))
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  white-space: nowrap;
}

.status-picker :deep(.p-select) {
  border: none;
  background: transparent;
  box-shadow: none;
}

.status-picker :deep(.p-select:not(.p-disabled):hover) {
  border: none;
  background: transparent;
}

.status-picker :deep(.p-select:not(.p-disabled).p-focus) {
  border: none;
  box-shadow: none;
}

.status-picker :deep(.p-select-label) {
  padding: 0;
}

.status-picker :deep(.p-select-dropdown) {
  display: none;
}
</style>
