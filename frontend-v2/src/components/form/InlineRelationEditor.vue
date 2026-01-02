<template>
  <div class="inline-relation-editor">
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
        :optionLabel="displayField"
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
            <i :class="getOptionIcon(slotProps.option)" />
            <span>{{ slotProps.option[displayField] }}</span>
            <span v-if="secondaryField && slotProps.option[secondaryField]" class="text-surface-400 text-sm truncate max-w-48">
              ({{ slotProps.option[secondaryField] }})
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
import api from '@/services/api'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'

const { t } = useI18n()

const props = defineProps({
  // Current value (UUID)
  modelValue: {
    type: String,
    default: null
  },
  // Full object for display (contains uuid + display field)
  relationData: {
    type: Object,
    default: null
  },
  // Type of relation: 'symptoms', 'tickets', 'configuration_items', 'persons', 'groups', 'locations', 'entities'
  relationObject: {
    type: String,
    required: true
  },
  // Field to display in autocomplete (e.g., 'label', 'title', 'name')
  displayField: {
    type: String,
    default: 'label'
  },
  // Secondary field to show in parentheses (e.g., 'code', 'ticket_type_code')
  secondaryField: {
    type: String,
    default: null
  },
  // Filter to apply (e.g., { ci_type_code: 'SERVICE' } or { ticket_type_code: 'PROBLEM' })
  relationFilter: {
    type: Object,
    default: null
  },
  // Placeholder text
  placeholder: {
    type: String,
    default: ''
  },
  // Disabled state
  disabled: {
    type: Boolean,
    default: false
  },
  // Icon to display (if not provided, will use default based on relationObject)
  icon: {
    type: String,
    default: null
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

// API endpoints mapping
const endpointMap = {
  symptoms: '/symptoms',
  tickets: '/tickets',
  configuration_items: '/configuration_items',
  persons: '/persons',
  groups: '/groups',
  locations: '/locations',
  entities: '/entities'
}

// Default icons mapping
const defaultIconMap = {
  symptoms: 'pi pi-exclamation-circle text-orange-500',
  tickets: 'pi pi-ticket',
  configuration_items: 'pi pi-box',
  persons: 'pi pi-user',
  groups: 'pi pi-users',
  locations: 'pi pi-map-marker',
  entities: 'pi pi-building'
}

// Ticket type icons
const ticketTypeIcons = {
  TASK: 'pi pi-check-square',
  INCIDENT: 'pi pi-exclamation-triangle',
  PROBLEM: 'pi pi-search',
  PROJECT: 'pi pi-folder',
  CHANGE: 'pi pi-sync',
  KNOWLEDGE: 'pi pi-book',
  USER_STORY: 'pi pi-user',
  SPRINT: 'pi pi-forward',
  EPIC: 'pi pi-star',
  DEFECT: 'pi pi-bug'
}

// Computed
const displayValue = computed(() => {
  if (props.relationData) {
    return props.relationData[props.displayField]
  }
  return null
})

const hasChanges = computed(() => {
  const currentUuid = localValue.value?.uuid || null
  const initialUuid = initialValue.value?.uuid || null
  return currentUuid !== initialUuid
})

// Methods
const getOptionIcon = (option) => {
  // Custom icon provided
  if (props.icon) {
    return props.icon
  }
  
  // For tickets, use dynamic icon based on ticket_type_code
  if (props.relationObject === 'tickets' && option.ticket_type_code) {
    return ticketTypeIcons[option.ticket_type_code] || 'pi pi-ticket'
  }
  
  // Default icon for relation type
  return defaultIconMap[props.relationObject] || 'pi pi-link'
}

const startEditing = () => {
  if (props.disabled) return
  
  isEditing.value = true
  
  // Set initial value from relationData
  if (props.relationData) {
    localValue.value = { ...props.relationData }
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
    emit('save', { uuid: newUuid, data: localValue.value })
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
    const endpoint = endpointMap[props.relationObject]
    
    if (!endpoint) {
      console.error(`[InlineRelationEditor] Unknown relation object: ${props.relationObject}`)
      suggestions.value = []
      return
    }
    
    // Build filters
    const filters = {}
    
    if (query.trim()) {
      filters.global = { value: query, matchMode: 'contains' }
    }
    
    // Apply relation filter (e.g., ci_type_code, ticket_type_code)
    if (props.relationFilter) {
      for (const [key, value] of Object.entries(props.relationFilter)) {
        // Convert filter key format (e.g., ci_type_code -> ci_type for the API)
        let filterKey = key
        if (key === 'ci_type_code') {
          filterKey = 'ci_type'
        }
        filters[filterKey] = { value, matchMode: 'equals' }
      }
    }
    
    // Special case for symptoms: filter by is_active
    if (props.relationObject === 'symptoms') {
      filters.is_active = { value: true, matchMode: 'equals' }
    }
    
    const response = await api.post(`${endpoint}/search`, {
      filters,
      page: 1,
      limit: 20,
      sortField: props.displayField,
      sortOrder: 1
    })
    
    suggestions.value = response.data?.data || []
  } catch (error) {
    console.error(`[InlineRelationEditor] Error searching ${props.relationObject}:`, error)
    suggestions.value = []
  }
}
</script>

<style scoped>
.inline-relation-editor {
  min-width: 200px;
}
</style>
