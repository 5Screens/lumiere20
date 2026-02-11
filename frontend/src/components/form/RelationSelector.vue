<template>
  <div class="relation-selector flex items-center gap-2">
    <AutoComplete
      ref="autocompleteRef"
      v-model="selectedItem"
      :suggestions="suggestions"
      @complete="onSearch"
      @item-select="onItemSelect"
      @clear="onClear"
      @click="handleInputClick"
      @blur="onBlur"
      @hide="onHide"
      :optionLabel="getDisplayValue"
      :placeholder="placeholder || $t('common.select')"
      :minLength="0"
      :loading="loading"
      :disabled="disabled"
      :virtualScrollerOptions="{ itemSize: 56 }"
      :multiple="multiple"
      :dataKey="'uuid'"
      dropdown
      :showClear="!multiple"
      forceSelection
      appendTo="body"
      class="flex-1"
      :pt="{ input: { class: 'w-full' } }"
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
            <div class="font-medium truncate">{{ getDisplayValue(option) }}</div>
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
    
    <!-- View details button (single mode only) -->
    <button
      v-if="!multiple"
      type="button"
      class="p-1.5 rounded-full transition-colors shrink-0"
      :class="selectedItem ? 'cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800' : 'cursor-not-allowed'"
      :style="{ color: selectedItem ? 'var(--p-primary-color)' : 'var(--p-surface-300)' }"
      :disabled="!selectedItem"
      @click="openDetailsDrawer"
      :title="$t('common.viewDetails')"
    >
      <i class="pi pi-eye text-lg" />
    </button>
    
    <!-- Details Drawer -->
    <Drawer 
      v-model:visible="detailsDrawerVisible" 
      position="right"
      class="w-full md:w-[600px]"
      :showCloseIcon="false"
      :showHeader="false"
    >
      <ObjectView
        v-if="detailsDrawerVisible"
        :object-type="relationObject"
        :object-id="selectedItem?.uuid"
        mode="view"
        @close="detailsDrawerVisible = false"
      />
    </Drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import AutoComplete from 'primevue/autocomplete'
import Drawer from 'primevue/drawer'
import ObjectView from '@/components/object/ObjectView.vue'
import { useReferenceDataStore } from '@/stores/referenceDataStore'

const { t } = useI18n()
const referenceDataStore = useReferenceDataStore()

const PAGE_SIZE = 20

const props = defineProps({
  // Current value (UUID or array of UUIDs in multiple mode)
  modelValue: {
    type: [String, Array],
    default: null
  },
  // Type of relation: 'persons', 'groups', 'locations', 'entities', 'configuration_items', 'ci_categories', etc.
  relationObject: {
    type: String,
    required: true
  },
  // Field to display - override from object_types metadata
  displayField: {
    type: String,
    default: null
  },
  // Secondary field to show - override from object_types metadata
  secondaryField: {
    type: String,
    default: null
  },
  // Filter to apply (e.g., { is_active: true }, { ci_type_code: 'MODEL' })
  // Supports dynamic placeholders like $ci_type which will be replaced from context
  relationFilter: {
    type: [Object, String],
    default: null
  },
  // Context object for resolving dynamic filter placeholders (e.g., { ci_type: 'SERVER' })
  context: {
    type: Object,
    default: () => ({})
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
  },
  // Multiple selection mode
  multiple: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// State
const selectedItem = ref(null)
const suggestions = ref([])
const loading = ref(false)
const autocompleteRef = ref(null)
const objectTypeMeta = ref(null)
const detailsDrawerVisible = ref(false)

// Multiple mode state
const savedSelections = ref([])
const isSearching = ref(false)

// Pagination state
const currentQuery = ref('')
const currentPage = ref(1)
const totalRecords = ref(0)
const hasMoreData = computed(() => suggestions.value.length < totalRecords.value)

// Refs for IntersectionObserver
const footerSentinelRef = ref(null)
const loadMoreTriggerRef = ref(null)
let intersectionObserver = null

// Parse relation filter if it's a string and resolve dynamic placeholders
const parsedRelationFilter = computed(() => {
  if (!props.relationFilter) return null
  
  let filterObj = props.relationFilter
  
  // Parse JSON string if needed
  if (typeof filterObj === 'string') {
    try {
      filterObj = JSON.parse(filterObj)
    } catch (e) {
      console.error('[RelationSelector] Failed to parse relationFilter:', e)
      return null
    }
  }
  
  // Resolve dynamic placeholders like $ci_type from context
  const resolved = {}
  for (const [key, value] of Object.entries(filterObj)) {
    if (typeof value === 'string' && value.startsWith('$')) {
      const contextKey = value.substring(1) // Remove $ prefix
      const contextValue = props.context?.[contextKey]
      if (contextValue !== undefined && contextValue !== null) {
        resolved[key] = contextValue
      } else {
        // Skip this filter if context value is not available
        console.warn(`[RelationSelector] Context value for ${value} not found, skipping filter`)
      }
    } else {
      resolved[key] = value
    }
  }
  
  return Object.keys(resolved).length > 0 ? resolved : null
})

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
    return objectTypeMeta.value.api_endpoint.replace('/api/v1', '')
  }
  return `/${props.relationObject}`
})

// Get display value for an option (handles special cases like persons with first_name + last_name)
const getDisplayValue = (option) => {
  if (!option) return ''
  
  // Special case for persons: show "first_name last_name"
  if (props.relationObject === 'persons' && option.first_name && option.last_name) {
    return `${option.first_name} ${option.last_name}`
  }
  
  return option[effectiveDisplayField.value] || ''
}

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
    console.error(`[RelationSelector] Error loading more ${props.relationObject}:`, error)
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
  
  // Apply relation filter from props
  if (parsedRelationFilter.value) {
    for (const [key, value] of Object.entries(parsedRelationFilter.value)) {
      let filterKey = key
      if (key === 'ci_type_code') {
        filterKey = 'ci_type'
      }
      filters[filterKey] = { value, matchMode: 'equals' }
    }
  }
  
  return filters
}

// Methods
const getOptionIcon = (option) => {
  if (option?.icon) {
    return `pi ${option.icon}`
  }
  return effectiveIcon.value
}

const onItemSelect = (event) => {
  if (props.multiple) {
    const newlySelected = event?.value
    const fromAutocomplete = Array.isArray(selectedItem.value) ? selectedItem.value : []
    const preserved = Array.isArray(savedSelections.value) ? savedSelections.value : []

    const byUuid = new Map()
    for (const item of preserved) {
      if (item?.uuid) byUuid.set(item.uuid, item)
    }
    for (const item of fromAutocomplete) {
      if (item?.uuid) byUuid.set(item.uuid, item)
    }
    if (newlySelected?.uuid) {
      byUuid.set(newlySelected.uuid, newlySelected)
    }

    const merged = Array.from(byUuid.values())
    selectedItem.value = merged
    savedSelections.value = merged
    isSearching.value = false

    emit('update:modelValue', merged.map(i => i.uuid))
  } else {
    const item = event.value
    emit('update:modelValue', item?.uuid || null)
  }
}

const onClear = () => {
  if (props.multiple && isSearching.value) {
    selectedItem.value = [...savedSelections.value]
    isSearching.value = false
    return
  }
  isSearching.value = false
  savedSelections.value = []
  emit('update:modelValue', props.multiple ? [] : null)
}

// Handle blur in multiple mode - restore selections if user was searching
const onBlur = () => {
  if (!props.multiple || !isSearching.value) return
  selectedItem.value = [...savedSelections.value]
  isSearching.value = false
}

// Handle dropdown hide in multiple mode
const onHide = () => {
  if (!props.multiple || !isSearching.value) return
  selectedItem.value = [...savedSelections.value]
  isSearching.value = false
}

// Handle click on input to show suggestions like the dropdown button
const handleInputClick = async (event) => {
  if (props.disabled) return
  
  // If the overlay is not visible, trigger a search with the current query
  // This simulates the behavior of clicking the dropdown chevron
  if (autocompleteRef.value && !autocompleteRef.value.overlayVisible) {
    await onSearch({ query: currentQuery.value })
    // Ensure the overlay is shown after data is loaded
    setTimeout(() => {
      if (autocompleteRef.value) {
        autocompleteRef.value.show()
      }
    }, 0)
  }
}

// Open details drawer
const openDetailsDrawer = () => {
  if (selectedItem.value) {
    detailsDrawerVisible.value = true
  }
}

const onSearch = async (event) => {
  const query = event?.query || ''

  if (props.multiple) {
    isSearching.value = true
    const currentSelections = Array.isArray(selectedItem.value) ? selectedItem.value : []
    if (currentSelections.length > 0) {
      savedSelections.value = [...currentSelections]
    }
  }
  
  currentQuery.value = query
  currentPage.value = 1
  
  loading.value = true
  try {
    const endpoint = effectiveEndpoint.value
    
    if (!endpoint) {
      console.error(`[RelationSelector] Unknown relation object: ${props.relationObject}`)
      suggestions.value = []
      totalRecords.value = 0
      return
    }
    
    const filters = buildFilters(query)
    
    const response = await api.post(`${endpoint}/search`, {
      filters,
      page: 1,
      limit: PAGE_SIZE,
      sortField: effectiveDisplayField.value,
      sortOrder: 1
    })
    
    suggestions.value = response.data?.data || []
    totalRecords.value = response.data?.total || 0
  } catch (error) {
    console.error(`[RelationSelector] Error searching ${props.relationObject}:`, error)
    suggestions.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

// Load initial value by UUID (single or multiple)
const loadInitialValue = async () => {
  if (!props.modelValue || (Array.isArray(props.modelValue) && props.modelValue.length === 0)) {
    selectedItem.value = props.multiple ? [] : null
    savedSelections.value = []
    return
  }
  
  try {
    const endpoint = effectiveEndpoint.value
    if (!endpoint) return
    
    if (props.multiple && Array.isArray(props.modelValue)) {
      // Load multiple items by UUID
      const items = await Promise.all(
        props.modelValue.map(uuid => api.get(`${endpoint}/${uuid}`).then(r => r.data).catch(() => null))
      )
      const loaded = items.filter(Boolean)
      selectedItem.value = loaded
      savedSelections.value = loaded
    } else {
      const response = await api.get(`${endpoint}/${props.modelValue}`)
      if (response.data) {
        selectedItem.value = response.data
      }
    }
  } catch (error) {
    console.error(`[RelationSelector] Error loading initial value:`, error)
    selectedItem.value = props.multiple ? [] : null
    savedSelections.value = []
  }
}

// Watch modelValue changes to reload initial value
watch(() => props.modelValue, (newVal, oldVal) => {
  if (props.multiple) {
    if (isSearching.value) return

    const newUuids = Array.isArray(newVal) ? newVal : []
    const currentUuids = (Array.isArray(selectedItem.value) ? selectedItem.value : [])
      .map(i => i?.uuid)
      .filter(Boolean)

    const isDifferent = newUuids.length !== currentUuids.length || newUuids.some(u => !currentUuids.includes(u))
    if (isDifferent) {
      loadInitialValue()
    }
    return
  }

  if (newVal !== oldVal) {
    if (newVal && (!selectedItem.value || selectedItem.value.uuid !== newVal)) {
      loadInitialValue()
    } else if (!newVal) {
      selectedItem.value = null
    }
  }
}, { immediate: false, deep: true })

// Load object type metadata and initial value on mount
onMounted(async () => {
  objectTypeMeta.value = await referenceDataStore.loadObjectType(props.relationObject)
  setupObserver()
  
  if (props.modelValue) {
    await loadInitialValue()
  }
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
.relation-selector {
  width: 100%;
}
</style>
