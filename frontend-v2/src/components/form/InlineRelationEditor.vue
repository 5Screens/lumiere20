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
        :optionLabel="effectiveDisplayField"
        :placeholder="placeholder"
        :minLength="0"
        :loading="loading"
        :virtualScrollerOptions="{ itemSize: 56 }"
        forceSelection
        dropdown
        appendTo="body"
        class="flex-1"
        :pt="{ root: { class: 'w-full' }, input: { class: 'w-full text-sm' } }"
      >
        <template #option="{ option, index }">
          <div 
            class="flex items-center gap-3 py-1"
            :ref="el => { if (index === suggestions.length - 3) loadMoreTriggerRef = el }"
          >
            <div class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center shrink-0">
              <i :class="[getOptionIcon(option), 'text-primary-600 dark:text-primary-400']" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{{ option[effectiveDisplayField] }}</div>
              <div v-if="effectiveSecondaryField && option[effectiveSecondaryField]" class="text-sm text-surface-500 truncate">
                {{ option[effectiveSecondaryField] }}
              </div>
            </div>
          </div>
        </template>
        <template #footer v-if="hasMoreData">
          <div ref="footerSentinelRef" class="p-2 text-center text-sm text-surface-500">
            <i v-if="loading" class="pi pi-spin pi-spinner mr-2"></i>
            <span v-if="loading">{{ $t('common.loading') }}</span>
            <span v-else>{{ $t('common.scrollForMore') }}</span>
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
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import { useReferenceDataStore } from '@/stores/referenceDataStore'

const { t } = useI18n()
const referenceDataStore = useReferenceDataStore()

const PAGE_SIZE = 20

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
  // Field to display in autocomplete - override from object_types metadata
  displayField: {
    type: String,
    default: null
  },
  // Secondary field to show - override from object_types metadata
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
  // Icon to display - override from object_types metadata
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
const loading = ref(false)
const autocompleteRef = ref(null)
const objectTypeMeta = ref(null)

// Pagination state
const currentQuery = ref('')
const currentPage = ref(1)
const totalRecords = ref(0)
const hasMoreData = computed(() => suggestions.value.length < totalRecords.value)

// Refs for IntersectionObserver
const footerSentinelRef = ref(null)
const loadMoreTriggerRef = ref(null)
let intersectionObserver = null

// Computed properties using metadata with prop overrides
const effectiveDisplayField = computed(() => 
  props.displayField || objectTypeMeta.value?.display_field || 'label'
)
const effectiveSecondaryField = computed(() => 
  props.secondaryField || objectTypeMeta.value?.secondary_field || null
)
const effectiveIcon = computed(() => 
  props.icon || (objectTypeMeta.value?.icon ? `pi ${objectTypeMeta.value.icon}` : 'pi pi-link')
)
const effectiveEndpoint = computed(() => {
  if (objectTypeMeta.value?.api_endpoint) {
    // Remove /api/v1 prefix if present
    return objectTypeMeta.value.api_endpoint.replace('/api/v1', '')
  }
  return `/${props.relationObject}`
})


// Setup IntersectionObserver for lazy loading
const setupObserver = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
  
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasMoreData.value && !loading.value) {
          loadMoreItems()
        }
      })
    },
    { threshold: 0.1 }
  )
}

// Watch for footer sentinel to observe
watch(footerSentinelRef, (newRef) => {
  if (newRef && intersectionObserver) {
    intersectionObserver.observe(newRef)
  }
})

// Watch for trigger element (3rd from last item)
watch(loadMoreTriggerRef, (newRef) => {
  if (newRef && intersectionObserver) {
    intersectionObserver.observe(newRef)
  }
})

// Load more items (next page)
const loadMoreItems = async () => {
  if (loading.value || !hasMoreData.value) return
  
  loading.value = true
  try {
    const endpoint = effectiveEndpoint.value
    if (!endpoint) return
    
    // Build filters
    const filters = buildFilters(currentQuery.value)
    
    const nextPage = currentPage.value + 1
    const response = await api.post(`${endpoint}/search`, {
      filters,
      page: nextPage,
      limit: PAGE_SIZE,
      sortField: effectiveDisplayField.value,
      sortOrder: 1
    })
    
    const newItems = response.data?.data || []
    if (newItems.length > 0) {
      suggestions.value = [...suggestions.value, ...newItems]
      currentPage.value = nextPage
    }
  } catch (error) {
    console.error(`[InlineRelationEditor] Error loading more ${props.relationObject}:`, error)
  } finally {
    loading.value = false
  }
}

// Build filters for search
const buildFilters = (query) => {
  const filters = {}
  
  if (query && query.trim()) {
    filters.global = { value: query, matchMode: 'contains' }
  }
  
  // Apply relation filter from props (e.g., { is_active: true }, { ci_type_code: 'SERVICE' })
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
  
  return filters
}

// Computed
const displayValue = computed(() => {
  if (props.relationData) {
    return props.relationData[effectiveDisplayField.value]
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
  // For tickets, use icon from ticket data (fetched from ticket_types.icon)
  if (props.relationObject === 'tickets' && option.icon) {
    return `pi ${option.icon}`
  }
  
  // Use effective icon from metadata or prop override
  return effectiveIcon.value
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
  const query = event.query || ''
  
  console.log('[InlineRelationEditor] onSearch called', {
    relationObject: props.relationObject,
    eventQuery: event.query,
    eventQueryType: typeof event.query,
    query,
    displayField: effectiveDisplayField.value,
    secondaryField: effectiveSecondaryField.value,
    relationFilter: props.relationFilter
  })
  
  // Reset pagination on new search
  currentQuery.value = query
  currentPage.value = 1
  
  loading.value = true
  try {
    const endpoint = effectiveEndpoint.value
    
    if (!endpoint) {
      console.error(`[InlineRelationEditor] Unknown relation object: ${props.relationObject}`)
      suggestions.value = []
      totalRecords.value = 0
      return
    }
    
    // Build filters using helper
    const filters = buildFilters(query)
    
    console.log('[InlineRelationEditor] Sending search request', {
      endpoint: `${endpoint}/search`,
      filters,
      sortField: effectiveDisplayField.value
    })
    
    const response = await api.post(`${endpoint}/search`, {
      filters,
      page: 1,
      limit: PAGE_SIZE,
      sortField: effectiveDisplayField.value,
      sortOrder: 1
    })
    
    console.log('[InlineRelationEditor] Search response', {
      dataCount: response.data?.data?.length,
      total: response.data?.total,
      firstItems: response.data?.data?.slice(0, 3).map(d => ({ uuid: d.uuid, first_name: d.first_name, last_name: d.last_name, label: d.label, name: d.name }))
    })
    
    suggestions.value = response.data?.data || []
    totalRecords.value = response.data?.total || 0
  } catch (error) {
    console.error(`[InlineRelationEditor] Error searching ${props.relationObject}:`, error)
    suggestions.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

// Load object type metadata on mount
onMounted(async () => {
  // Load metadata for the relation object type
  objectTypeMeta.value = await referenceDataStore.loadObjectType(props.relationObject)
  setupObserver()
})

// Cleanup observer on unmount
onUnmounted(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
    intersectionObserver = null
  }
})
</script>

<style scoped>
.inline-relation-editor {
  min-width: 200px;
}
</style>
