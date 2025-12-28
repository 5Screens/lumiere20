<template>
  <div class="group-selector">
    <AutoComplete
      ref="autocompleteRef"
      v-model="selectedGroup"
      :suggestions="suggestions"
      :placeholder="$t('common.searchGroup')"
      :disabled="disabled"
      :virtualScrollerOptions="{ itemSize: 48 }"
      optionLabel="group_name"
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
          <div class="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-semibold shrink-0">
            <i class="pi pi-users"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ option.group_name }}</div>
            <div v-if="option.support_level" class="text-sm text-surface-500 truncate">
              {{ $t('groups.supportLevel') }}: {{ option.support_level }}
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
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import groupsService from '@/services/groupsService'

const PAGE_SIZE = 25

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

const autocompleteRef = ref(null)
const selectedGroup = ref(null)
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
          loadMoreGroups()
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

// Load more groups (next page)
const loadMoreGroups = async () => {
  if (loading.value || !hasMoreData.value) return
  
  loading.value = true
  try {
    const filters = {}
    if (currentQuery.value.length > 0) {
      filters.global = { value: currentQuery.value, matchMode: 'contains' }
    }
    
    const nextPage = currentPage.value + 1
    const result = await groupsService.search({
      filters,
      page: nextPage,
      limit: PAGE_SIZE,
      sortField: 'group_name',
      sortOrder: 1
    })
    
    if (result.data && result.data.length > 0) {
      suggestions.value = [...suggestions.value, ...result.data]
      currentPage.value = nextPage
    }
  } catch (error) {
    console.error('Failed to load more groups:', error)
  } finally {
    loading.value = false
  }
}

// Search groups via API (initial search)
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
    
    const result = await groupsService.search({
      filters,
      page: 1,
      limit: PAGE_SIZE,
      sortField: 'group_name',
      sortOrder: 1
    })
    
    totalRecords.value = result.total || 0
    suggestions.value = result.data || []
  } catch (error) {
    console.error('Failed to search groups:', error)
    suggestions.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

// Selection handler
const onSelect = (event) => {
  const group = event.value
  if (group?.uuid) {
    emit('update:modelValue', group.uuid)
  }
}

// Clear handler
const onClear = () => {
  selectedGroup.value = null
  emit('update:modelValue', null)
}

// Load selected group by UUID
const loadSelectedGroup = async () => {
  if (!props.modelValue) {
    selectedGroup.value = null
    return
  }
  
  try {
    // Check if it's already in suggestions
    const cached = suggestions.value.find(g => g.uuid === props.modelValue)
    if (cached) {
      selectedGroup.value = cached
      return
    }
    
    // Otherwise fetch it
    const group = await groupsService.getByUuid(props.modelValue)
    if (group) {
      selectedGroup.value = group
    }
  } catch (error) {
    console.error('Failed to load selected group:', error)
    selectedGroup.value = null
  }
}

// Load selected group on mount and setup observer
onMounted(() => {
  setupObserver()
  if (props.modelValue) {
    loadSelectedGroup()
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
    if (newVal && newVal !== selectedGroup.value?.uuid) {
      loadSelectedGroup()
    } else if (!newVal) {
      selectedGroup.value = null
    }
  }
})
</script>
