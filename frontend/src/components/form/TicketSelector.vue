<template>
  <div class="ticket-selector">
    <AutoComplete
      ref="autocompleteRef"
      v-model="selectedTicket"
      :suggestions="suggestions"
      :placeholder="placeholder || $t('common.searchTicket')"
      :disabled="disabled"
      :virtualScrollerOptions="{ itemSize: 56 }"
      optionLabel="title"
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
          <div 
            class="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0"
            :class="getTicketTypeClass(option.ticket_type_code)"
          >
            <i :class="getTicketTypeIcon(option.ticket_type_code)"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ option.title }}</div>
            <div class="text-sm text-surface-500 truncate">
              {{ option.ticket_type_code }}
              <span v-if="option.status" class="ml-2">• {{ option.status.name }}</span>
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
import ticketsService from '@/services/ticketsService'

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
  // Filter by ticket type code (e.g., 'PROJECT', 'EPIC', 'SPRINT', 'PROBLEM', 'CHANGE')
  ticketTypeCode: {
    type: String,
    default: null
  },
  placeholder: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const autocompleteRef = ref(null)
const selectedTicket = ref(null)
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

// Get ticket type icon
const getTicketTypeIcon = (typeCode) => {
  const icons = {
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
  return icons[typeCode] || 'pi pi-ticket'
}

// Get ticket type class
const getTicketTypeClass = (typeCode) => {
  const classes = {
    TASK: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    INCIDENT: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
    PROBLEM: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
    PROJECT: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
    CHANGE: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    KNOWLEDGE: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-400',
    USER_STORY: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400',
    SPRINT: 'bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400',
    EPIC: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400',
    DEFECT: 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400'
  }
  return classes[typeCode] || 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
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
          loadMoreTickets()
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

// Load more tickets (next page)
const loadMoreTickets = async () => {
  if (loading.value || !hasMoreData.value) return
  
  loading.value = true
  try {
    const filters = {}
    if (currentQuery.value.length > 0) {
      filters.global = { value: currentQuery.value, matchMode: 'contains' }
    }
    
    const nextPage = currentPage.value + 1
    const result = await ticketsService.search({
      filters,
      page: nextPage,
      limit: PAGE_SIZE,
      sortField: 'title',
      sortOrder: 1
    }, props.ticketTypeCode)
    
    if (result.data && result.data.length > 0) {
      suggestions.value = [...suggestions.value, ...result.data]
      currentPage.value = nextPage
    }
  } catch (error) {
    console.error('Failed to load more tickets:', error)
  } finally {
    loading.value = false
  }
}

// Search tickets via API (initial search)
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
    
    const searchParams = {
      filters,
      page: 1,
      limit: PAGE_SIZE,
      sortField: 'title',
      sortOrder: 1
    }
    
    const result = await ticketsService.search(searchParams, props.ticketTypeCode)
    
    totalRecords.value = result.total || 0
    suggestions.value = result.data || []
  } catch (error) {
    console.error('Failed to search tickets:', error)
    suggestions.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

// Selection handler
const onSelect = (event) => {
  const ticket = event.value
  if (ticket?.uuid) {
    emit('update:modelValue', ticket.uuid)
    emit('select', ticket)
  }
}

// Clear handler
const onClear = () => {
  selectedTicket.value = null
  emit('update:modelValue', null)
}

// Load selected ticket by UUID
const loadSelectedTicket = async () => {
  if (!props.modelValue) {
    selectedTicket.value = null
    return
  }
  
  try {
    // Check if it's already in suggestions
    const cached = suggestions.value.find(t => t.uuid === props.modelValue)
    if (cached) {
      selectedTicket.value = cached
      return
    }
    
    // Otherwise fetch it
    const ticket = await ticketsService.getByUuid(props.modelValue)
    if (ticket) {
      selectedTicket.value = ticket
    }
  } catch (error) {
    console.error('Failed to load selected ticket:', error)
    selectedTicket.value = null
  }
}

// Load selected ticket on mount and setup observer
onMounted(() => {
  setupObserver()
  if (props.modelValue) {
    loadSelectedTicket()
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
    if (newVal && newVal !== selectedTicket.value?.uuid) {
      loadSelectedTicket()
    } else if (!newVal) {
      selectedTicket.value = null
    }
  }
})
</script>
