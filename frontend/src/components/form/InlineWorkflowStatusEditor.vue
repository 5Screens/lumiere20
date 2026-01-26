<template>
  <div class="inline-workflow-status-editor">
    <!-- Display mode -->
    <div 
      v-if="!isEditing" 
      class="cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 px-2 py-1 rounded transition-colors"
      @click="startEditing"
    >
      <Tag 
        v-if="currentStatus"
        :value="currentStatus.name"
        :style="{ backgroundColor: currentStatus.category?.color || '#6b7280', color: 'white' }"
      />
      <span v-else class="text-surface-400 italic">{{ $t('workflow.noStatus') }}</span>
    </div>

    <!-- Edit mode -->
    <div v-else class="flex items-center gap-1">
      <Select
        ref="selectRef"
        v-model="localValue"
        :options="availableStatuses"
        optionLabel="name"
        optionValue="uuid"
        :placeholder="$t('workflow.selectStatus')"
        :loading="loadingStatuses"
        class="flex-1"
        :pt="{ root: { class: 'w-full' } }"
      >
        <template #value="slotProps">
          <div v-if="slotProps.value" class="flex items-center gap-2">
            <Tag 
              :style="{ backgroundColor: getStatusColor(slotProps.value), color: 'white' }"
              class="text-sm"
            >
              {{ getStatusName(slotProps.value) }}
            </Tag>
          </div>
          <span v-else class="text-surface-400">{{ slotProps.placeholder }}</span>
        </template>
        <template #option="slotProps">
          <div class="flex items-center gap-2">
            <Tag 
              :style="{ backgroundColor: slotProps.option.category?.color || '#6b7280', color: 'white' }"
              class="text-sm"
            >
              {{ slotProps.option.name }}
            </Tag>
            <span v-if="slotProps.option.transitionName" class="text-surface-400 text-xs">
              ({{ slotProps.option.transitionName }})
            </span>
          </div>
        </template>
      </Select>
      
      <!-- Buttons stacked vertically -->
      <div class="flex flex-col gap-0">
        <!-- Save button (top) -->
        <Button
          icon="pi pi-check"
          severity="success"
          size="small"
          text
          @click.stop="save"
          :disabled="saving || !hasChanges"
          v-tooltip.left="$t('common.save')"
          :pt="{ root: { class: 'p-1 w-6 h-6' }, icon: { class: 'text-xs' } }"
        />
        
        <!-- Cancel button (bottom) -->
        <Button
          icon="pi pi-times"
          severity="danger"
          size="small"
          text
          @click.stop="cancel"
          :disabled="saving"
          v-tooltip.left="$t('common.cancel')"
          :pt="{ root: { class: 'p-1 w-6 h-6' }, icon: { class: 'text-xs' } }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  statusObject: {
    type: Object,
    default: null
  },
  entityType: {
    type: String,
    required: true
  },
  entityUuid: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

// State
const isEditing = ref(false)
const localValue = ref(null)
const initialValue = ref(null)
const availableStatuses = ref([])
const loadingStatuses = ref(false)
const saving = ref(false)
const selectRef = ref(null)

// Computed
const currentStatus = computed(() => {
  return props.statusObject || null
})

const hasChanges = computed(() => {
  return localValue.value !== initialValue.value
})

// Methods
const getStatusName = (uuid) => {
  const status = availableStatuses.value.find(s => s.uuid === uuid)
  return status?.name || ''
}

const getStatusColor = (uuid) => {
  const status = availableStatuses.value.find(s => s.uuid === uuid)
  return status?.category?.color || '#6b7280'
}

const loadAvailableStatuses = async () => {
  loadingStatuses.value = true
  try {
    const currentStatusUuid = props.modelValue || ''
    const response = await api.get(
      `/workflows/entity/${props.entityType}/${props.entityUuid}/available-statuses`,
      { params: { currentStatusUuid } }
    )
    availableStatuses.value = response.data || []
    
    // Add current status to the list if not already present
    if (props.statusObject && !availableStatuses.value.find(s => s.uuid === props.statusObject.uuid)) {
      availableStatuses.value.unshift({
        uuid: props.statusObject.uuid,
        name: props.statusObject.name,
        category: props.statusObject.category,
        transitionName: null
      })
    }
  } catch (error) {
    console.error('[InlineWorkflowStatusEditor] Error loading available statuses:', error)
    availableStatuses.value = []
    
    // If error, at least show current status
    if (props.statusObject) {
      availableStatuses.value = [{
        uuid: props.statusObject.uuid,
        name: props.statusObject.name,
        category: props.statusObject.category,
        transitionName: null
      }]
    }
  } finally {
    loadingStatuses.value = false
  }
}

const startEditing = async () => {
  if (props.disabled) return
  
  isEditing.value = true
  localValue.value = props.modelValue
  initialValue.value = props.modelValue
  
  // Load available statuses
  await loadAvailableStatuses()
  
  // Focus select after render
  nextTick(() => {
    if (selectRef.value?.$el) {
      const trigger = selectRef.value.$el.querySelector('[role="combobox"]')
      if (trigger) trigger.click()
    }
  })
}

const save = async () => {
  if (!hasChanges.value) {
    cancel()
    return
  }
  
  saving.value = true
  try {
    const selectedStatus = availableStatuses.value.find(s => s.uuid === localValue.value)
    emit('save', { uuid: localValue.value, status: selectedStatus })
    isEditing.value = false
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  localValue.value = initialValue.value
  isEditing.value = false
  emit('cancel')
}
</script>

<style scoped>
.inline-workflow-status-editor {
  min-width: 150px;
}
</style>
