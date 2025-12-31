<template>
  <div class="symptoms-selector">
    <AutoComplete
      ref="autocompleteRef"
      v-model="selectedSymptom"
      :suggestions="suggestions"
      :placeholder="$t('common.searchSymptom')"
      :disabled="disabled"
      :virtualScrollerOptions="{ itemSize: 48 }"
      optionLabel="label"
      dataKey="uuid"
      dropdown
      forceSelection
      :loading="loading"
      class="w-full"
      @complete="onSearch"
      @item-select="onSelect"
      @clear="onClear"
    >
      <template #option="{ option, index }">
        <div 
          class="flex items-center gap-3 py-1"
          :ref="el => { if (index === suggestions.length - 3) loadMoreTriggerRef = el }"
        >
          <div class="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600 dark:text-orange-400 text-sm font-semibold shrink-0">
            <i class="pi pi-exclamation-circle"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ option.label }}</div>
            <div class="text-sm text-surface-500 truncate">{{ option.code }}</div>
          </div>
          <Tag 
            v-if="option.is_active === false" 
            :value="$t('common.inactive')" 
            severity="secondary"
            class="text-xs shrink-0"
          />
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
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import Tag from 'primevue/tag'
import symptomsService from '@/services/symptomsService'

const PAGE_SIZE = 25

const props = defineProps({
  modelValue: {
    type: String,
    default: null
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

const emit = defineEmits(['update:modelValue'])

const autocompleteRef = ref(null)
const selectedSymptom = ref(null)
const suggestions = ref([])
const loading = ref(false)
const currentQuery = ref('')
const currentPage = ref(1)
const totalRecords = ref(0)
const hasMoreData = computed(() => suggestions.value.length < totalRecords.value)

// Refs for IntersectionObserver
const footerSentinelRef = ref(null)
const loadMoreTriggerRef = ref(null)
let intersectionObserver = null

// Setup IntersectionObserver for lazy loading
const setupObserver = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
  
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasMoreData.value && !loading.value) {
          loadMoreSymptoms()
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

// Load more symptoms (next page)
const loadMoreSymptoms = async () => {
  if (loading.value || !hasMoreData.value) return
  
  loading.value = true
  try {
    const filters = {}
    if (currentQuery.value.length > 0) {
      filters.global = { value: currentQuery.value, matchMode: 'contains' }
    }
    if (props.onlyActive) {
      filters.is_active = { value: true, matchMode: 'equals' }
    }
    
    const nextPage = currentPage.value + 1
    const result = await symptomsService.search({
      filters,
      page: nextPage,
      limit: PAGE_SIZE,
      sortField: 'label',
      sortOrder: 1
    })
    
    if (result.data && result.data.length > 0) {
      suggestions.value = [...suggestions.value, ...result.data]
      currentPage.value = nextPage
    }
  } catch (error) {
    console.error('Failed to load more symptoms:', error)
  } finally {
    loading.value = false
  }
}

// Search symptoms via API (initial search)
const onSearch = async (event) => {
  const query = event.query?.trim() || ''
  
  currentQuery.value = query
  currentPage.value = 1
  
  loading.value = true
  try {
    const filters = {}
    if (query.length > 0) {
      filters.global = { value: query, matchMode: 'contains' }
    }
    if (props.onlyActive) {
      filters.is_active = { value: true, matchMode: 'equals' }
    }
    
    const searchParams = {
      filters,
      page: 1,
      limit: PAGE_SIZE,
      sortField: 'label',
      sortOrder: 1
    }
    
    const result = await symptomsService.search(searchParams)
    
    totalRecords.value = result.total || 0
    suggestions.value = result.data || []
  } catch (error) {
    console.error('Failed to search symptoms:', error)
    suggestions.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

// Selection handler
const onSelect = (event) => {
  const symptom = event.value
  if (symptom?.uuid) {
    emit('update:modelValue', symptom.uuid)
  }
}

// Clear handler
const onClear = () => {
  selectedSymptom.value = null
  emit('update:modelValue', null)
}

// Load selected symptom by UUID
const loadSelectedSymptom = async () => {
  if (!props.modelValue) {
    selectedSymptom.value = null
    return
  }
  
  try {
    // Check if it's already in suggestions
    const cached = suggestions.value.find(s => s.uuid === props.modelValue)
    if (cached) {
      selectedSymptom.value = cached
      return
    }
    
    // Otherwise fetch it
    const symptom = await symptomsService.getByUuid(props.modelValue)
    if (symptom) {
      selectedSymptom.value = symptom
    }
  } catch (error) {
    console.error('Failed to load selected symptom:', error)
    selectedSymptom.value = null
  }
}

// Load selected symptom on mount and setup observer
onMounted(() => {
  setupObserver()
  if (props.modelValue) {
    loadSelectedSymptom()
  }
})

// Cleanup observer on unmount
onUnmounted(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
    intersectionObserver = null
  }
})

// Watch for external modelValue changes
watch(() => props.modelValue, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    if (newVal && newVal !== selectedSymptom.value?.uuid) {
      loadSelectedSymptom()
    } else if (!newVal) {
      selectedSymptom.value = null
    }
  }
})
</script>
