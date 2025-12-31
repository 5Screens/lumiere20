<template>
  <div class="inline-symptoms-editor">
    <!-- Display mode -->
    <div 
      v-if="!isEditing" 
      class="cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 px-2 py-1 rounded transition-colors"
      @click="startEditing"
    >
      <span v-if="displayValue">{{ displayValue }}</span>
      <span v-else class="text-surface-400 italic">{{ placeholder }}</span>
    </div>

    <!-- Edit mode -->
    <div v-else class="flex items-center gap-1">
      <AutoComplete
        ref="autocompleteRef"
        v-model="localValue"
        :suggestions="suggestions"
        @complete="onSearch"
        @item-select="onItemSelect"
        optionLabel="label"
        :placeholder="placeholder"
        :minLength="0"
        forceSelection
        dropdown
        appendTo="body"
        class="flex-1"
        :pt="{ root: { class: 'w-full' }, input: { class: 'w-full text-sm' } }"
      >
        <template #option="slotProps">
          <div class="flex items-center gap-2">
            <i class="pi pi-exclamation-circle text-orange-500" />
            <span>{{ slotProps.option.label }}</span>
            <span class="text-surface-400 text-sm truncate max-w-48">
              ({{ slotProps.option.code }})
            </span>
          </div>
        </template>
      </AutoComplete>
      
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
import symptomsService from '@/services/symptomsService'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  symptomObject: {
    type: Object,
    default: null
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  onlyActive: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

// State
const isEditing = ref(false)
const localValue = ref(null)
const initialValue = ref(null)
const suggestions = ref([])
const saving = ref(false)
const autocompleteRef = ref(null)

// Computed
const displayValue = computed(() => {
  if (props.symptomObject) {
    return props.symptomObject.label
  }
  return null
})

const hasChanges = computed(() => {
  const currentUuid = localValue.value?.uuid || null
  const initialUuid = initialValue.value?.uuid || null
  return currentUuid !== initialUuid
})

// Methods
const startEditing = () => {
  if (props.disabled) return
  
  isEditing.value = true
  
  // Set initial value
  if (props.symptomObject) {
    localValue.value = {
      uuid: props.symptomObject.uuid,
      label: props.symptomObject.label,
      code: props.symptomObject.code
    }
  } else {
    localValue.value = null
  }
  initialValue.value = localValue.value ? { ...localValue.value } : null
  
  // Focus autocomplete after render
  nextTick(() => {
    if (autocompleteRef.value?.$el) {
      const input = autocompleteRef.value.$el.querySelector('input')
      if (input) input.focus()
    }
  })
}

const onItemSelect = (event) => {
  localValue.value = event.value
}

const save = async () => {
  saving.value = true
  try {
    const newUuid = localValue.value?.uuid || null
    emit('save', { uuid: newUuid, symptom: localValue.value })
    isEditing.value = false
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  localValue.value = initialValue.value ? { ...initialValue.value } : null
  isEditing.value = false
  emit('cancel')
}

const onSearch = async (event) => {
  try {
    const query = event.query || ''
    const filters = {}
    
    if (query.trim()) {
      filters.global = { value: query, matchMode: 'contains' }
    }
    if (props.onlyActive) {
      filters.is_active = { value: true, matchMode: 'equals' }
    }
    
    const result = await symptomsService.search({
      filters,
      page: 1,
      limit: 20,
      sortField: 'label',
      sortOrder: 1
    })
    
    suggestions.value = (result.data || []).map(s => ({
      uuid: s.uuid,
      label: s.label,
      code: s.code
    }))
  } catch (error) {
    console.error('[InlineSymptomsEditor] Error searching symptoms:', error)
    suggestions.value = []
  }
}
</script>

<style scoped>
.inline-symptoms-editor {
  min-width: 200px;
}
</style>
