<template>
  <div class="person-selector">
    <div class="flex items-center gap-2">
      <AutoComplete
        ref="autocompleteRef"
        :modelValue="selectedPerson"
        @update:modelValue="onAutoCompleteModelUpdate"
        :suggestions="suggestions"
        :placeholder="$t('common.searchPerson')"
        :disabled="disabled"
        :virtualScrollerOptions="{ itemSize: 56 }"
        optionLabel="display_name"
        dataKey="uuid"
        dropdown
        forceSelection
        :multiple="multiple"
        :loading="loading"
        class="flex-1"
        @complete="onSearch"
        @item-select="onSelect"
        @clear="onClear"
        @blur="onBlur"
        @hide="onHide"
      >
        <template #option="{ option, index }">
          <div 
            class="flex items-center gap-3 py-1"
            :ref="el => { if (index === suggestions.length - 3) loadMoreTriggerRef = el }"
          >
            <div class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold shrink-0">
              {{ getInitials(option) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{{ option.first_name }} {{ option.last_name }}</div>
              <div class="text-sm text-surface-500 truncate">{{ option.email }}</div>
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
      
      <!-- View person button with cyberpunk animation -->
      <div v-if="canViewPerson" class="relative shrink-0 group">
        <!-- Animated glow using Tailwind -->
        <span class="absolute inset-0 rounded-full bg-primary-400/30 animate-ping"></span>
        <Button
          icon="pi pi-eye"
          severity="success"
          text
          rounded
          size="small"
          @click="openPersonDrawer"
          v-tooltip.top="$t('common.view')"
          :pt="{ 
            root: { class: 'relative z-10 hover:scale-110 transition-transform duration-200' },
            icon: { class: 'text-primary-500 group-hover:text-primary-400 transition-colors' }
          }"
        />
      </div>
    </div>
    
    <!-- Person View Drawer -->
    <Drawer
      v-model:visible="personDrawerVisible"
      position="right"
      class="w-full md:w-[600px]"
      :showHeader="false"
    >
      <ObjectView
        v-if="personDrawerVisible && viewPersonUuid"
        objectType="persons"
        :objectId="viewPersonUuid"
        mode="edit"
        @saved="onPersonSaved"
        @close="personDrawerVisible = false"
      />
    </Drawer>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import ObjectView from '@/components/object/ObjectView.vue'
import personsService from '@/services/personsService'

const MIN_SEARCH_LENGTH = 2
const PAGE_SIZE = 20

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const autocompleteRef = ref(null)
const selectedPerson = ref(null)
const suggestions = ref([])
const loading = ref(false)
const currentQuery = ref('')
const currentPage = ref(1)
const totalRecords = ref(0)
const hasMoreData = computed(() => suggestions.value.length < totalRecords.value)

const DEBUG = false

// Store saved selections to preserve during search (multiple mode)
const savedSelections = ref([])

// Flag to ignore reactive side effects while user is typing/searching
const isSearching = ref(false)

const logDebug = (action, data = {}) => {
  if (!DEBUG) return
  try {
    console.log(`[PersonSelector] ${action}`, data)
  } catch {
    console.log(`[PersonSelector] ${action}`)
  }
}

// Person drawer state
const personDrawerVisible = ref(false)
const viewPersonUuid = ref(null)

// Can view person (single mode with a selected person)
const canViewPerson = computed(() => {
  if (props.multiple) {
    return false // For now, don't show view button in multiple mode
  }
  return !!props.modelValue
})

// Open person drawer
const openPersonDrawer = () => {
  if (props.multiple) return
  viewPersonUuid.value = props.modelValue
  personDrawerVisible.value = true
}

// Handle person saved in drawer
const onPersonSaved = async () => {
  personDrawerVisible.value = false
  // Reload the selected person to get updated data
  await loadSelectedPerson()
}

// Refs for IntersectionObserver
const footerSentinelRef = ref(null)
const loadMoreTriggerRef = ref(null)
let intersectionObserver = null

// Get initials for avatar
const getInitials = (person) => {
  const first = person?.first_name?.[0] || ''
  const last = person?.last_name?.[0] || ''
  return (first + last).toUpperCase()
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
          loadMorePersons()
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

// Load more persons (next page)
const loadMorePersons = async () => {
  if (loading.value || !hasMoreData.value) return
  
  loading.value = true
  try {
    const filters = {}
    if (currentQuery.value.length >= MIN_SEARCH_LENGTH) {
      filters.global = { value: currentQuery.value, matchMode: 'contains' }
    }
    
    const nextPage = currentPage.value + 1
    const result = await personsService.search({
      filters,
      page: nextPage,
      limit: PAGE_SIZE,
      sortField: 'last_name',
      sortOrder: 1
    })
    
    if (result.data && result.data.length > 0) {
      const newPersons = result.data.map(p => ({
        ...p,
        display_name: `${p.first_name} ${p.last_name}`
      }))
      suggestions.value = [...suggestions.value, ...newPersons]
      currentPage.value = nextPage
    }
  } catch (error) {
    console.error('Failed to load more persons:', error)
  } finally {
    loading.value = false
  }
}

// Search persons via API (initial search)
const onSearch = async (event) => {
  const query = event.query?.trim() || ''

  if (props.multiple) {
    isSearching.value = true
    const currentSelections = Array.isArray(selectedPerson.value) ? selectedPerson.value : []
    if (currentSelections.length > 0) {
      savedSelections.value = [...currentSelections]
    }
    logDebug('search-start (multiple)', {
      query,
      savedSelectionUuids: savedSelections.value.map(p => p?.uuid).filter(Boolean)
    })
  }

  currentQuery.value = query
  currentPage.value = 1

  loading.value = true
  try {
    // Build filters - only add globalFilter if query is not empty
    const filters = {}
    if (query.length >= MIN_SEARCH_LENGTH) {
      filters.global = { value: query, matchMode: 'contains' }
    }
    
    const result = await personsService.search({
      filters,
      page: 1,
      limit: PAGE_SIZE,
      sortField: 'last_name',
      sortOrder: 1
    })
    
    totalRecords.value = result.total || 0
    
    // Add display_name for optionLabel
    suggestions.value = (result.data || []).map(p => ({
      ...p,
      display_name: `${p.first_name} ${p.last_name}`
    }))
  } catch (error) {
    console.error('Failed to search persons:', error)
    suggestions.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

// Handle selection
const onSelect = (event) => {
  if (props.multiple) {
    const newlySelected = event?.value
    const fromAutocomplete = Array.isArray(selectedPerson.value) ? selectedPerson.value : []
    const preserved = Array.isArray(savedSelections.value) ? savedSelections.value : []

    const byUuid = new Map()
    for (const p of preserved) {
      if (p?.uuid) byUuid.set(p.uuid, p)
    }
    for (const p of fromAutocomplete) {
      if (p?.uuid) byUuid.set(p.uuid, p)
    }
    if (newlySelected?.uuid) {
      byUuid.set(newlySelected.uuid, newlySelected)
    }

    const merged = Array.from(byUuid.values())
    selectedPerson.value = merged
    savedSelections.value = merged

    const uuids = merged.map(p => p.uuid)
    isSearching.value = false

    logDebug('select (multiple)', {
      newlySelectedUuid: newlySelected?.uuid,
      mergedUuids: uuids
    })

    emit('update:modelValue', uuids)
  } else {
    const person = event.value
    emit('update:modelValue', person?.uuid || null)
  }
}

// Handle clear
const onClear = () => {
  if (props.multiple && isSearching.value) {
    // With forceSelection, PrimeVue may emit clear while typing.
    // Do not propagate this to parent, otherwise chips disappear.
    selectedPerson.value = [...savedSelections.value]
    isSearching.value = false
    logDebug('clear ignored (multiple, searching)', {
      restoredUuids: savedSelections.value.map(p => p?.uuid).filter(Boolean)
    })
    return
  }

  isSearching.value = false
  savedSelections.value = []
  emit('update:modelValue', props.multiple ? [] : null)
}

const onAutoCompleteModelUpdate = (newValue) => {
  if (props.multiple) {
    // PrimeVue can mutate v-model during typing (especially with forceSelection).
    // We keep it local, but do NOT emit to parent here.
    if (isSearching.value && Array.isArray(newValue) && newValue.length === 0 && savedSelections.value.length > 0) {
      // Prevent UI from dropping chips while typing.
      selectedPerson.value = [...savedSelections.value]
      logDebug('model-update prevented empty (multiple, searching)', {
        restoredUuids: savedSelections.value.map(p => p?.uuid).filter(Boolean)
      })
      return
    }

    selectedPerson.value = newValue
    logDebug('model-update (multiple)', {
      isSearching: isSearching.value,
      localUuids: (Array.isArray(newValue) ? newValue : []).map(p => p?.uuid).filter(Boolean)
    })
    return
  }

  selectedPerson.value = newValue
}

const onBlur = () => {
  if (!props.multiple) return
  if (!isSearching.value) return

  // User typed and left without selecting. Restore previous selections.
  selectedPerson.value = [...savedSelections.value]
  isSearching.value = false
  logDebug('blur restore (multiple)', {
    restoredUuids: savedSelections.value.map(p => p?.uuid).filter(Boolean)
  })
}

const onHide = () => {
  if (!props.multiple) return
  if (!isSearching.value) return

  // Dropdown closed while typing. Restore previous selections.
  selectedPerson.value = [...savedSelections.value]
  isSearching.value = false
  logDebug('hide restore (multiple)', {
    restoredUuids: savedSelections.value.map(p => p?.uuid).filter(Boolean)
  })
}

// Load person details for display when modelValue is set
const loadSelectedPerson = async () => {
  if (!props.modelValue || (Array.isArray(props.modelValue) && props.modelValue.length === 0)) {
    selectedPerson.value = props.multiple ? [] : null
    savedSelections.value = []
    return
  }
  
  try {
    if (props.multiple && Array.isArray(props.modelValue)) {
      // Load multiple persons
      const persons = await Promise.all(
        props.modelValue.map(uuid => personsService.getByUuid(uuid))
      )
      const loaded = persons
        .filter(p => p)
        .map(p => ({
          ...p,
          display_name: `${p.first_name} ${p.last_name}`
        }))
      selectedPerson.value = loaded
      savedSelections.value = loaded
    } else {
      const person = await personsService.getByUuid(props.modelValue)
      if (person) {
        selectedPerson.value = {
          ...person,
          display_name: `${person.first_name} ${person.last_name}`
        }
      }
    }
  } catch (error) {
    console.error('Failed to load person:', error)
    selectedPerson.value = props.multiple ? [] : null
    savedSelections.value = []
  }
}

// Load selected person on mount and setup observer
onMounted(() => {
  setupObserver()
  if (props.modelValue) {
    loadSelectedPerson()
  }
})

// Cleanup observer on unmount
onUnmounted(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
    intersectionObserver = null
  }
})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal, oldVal) => {
  if (props.multiple) {
    if (isSearching.value) {
      logDebug('modelValue change ignored (multiple, searching)', { newVal, oldVal })
      return
    }

    const newUuids = Array.isArray(newVal) ? newVal : []
    const currentUuids = (Array.isArray(selectedPerson.value) ? selectedPerson.value : [])
      .map(p => p?.uuid)
      .filter(Boolean)

    const isDifferent = newUuids.length !== currentUuids.length || newUuids.some(u => !currentUuids.includes(u))
    if (isDifferent) {
      logDebug('modelValue changed (multiple) -> reload', { newUuids, currentUuids })
      loadSelectedPerson()
    }
    return
  }

  if (newVal !== oldVal) {
    if (newVal && newVal !== selectedPerson.value?.uuid) {
      loadSelectedPerson()
    } else if (!newVal) {
      selectedPerson.value = null
    }
  }
}, { deep: true })
</script>
