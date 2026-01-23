<template>
  <div 
    ref="containerRef"
    class="global-search relative transition-all duration-300 ease-out"
    :class="isFocused ? 'w-full' : 'w-64'"
  >
    <!-- Search Input -->
    <IconField>
      <InputIcon class="pi pi-search" />
      <InputText
        ref="inputRef"
        v-model="searchQuery"
        :placeholder="$t('common.search')"
        class="w-full"
        @focus="onFocus"
        @input="onInput"
        @keydown="onKeydown"
      />
      <InputIcon 
        v-if="loading" 
        class="pi pi-spin pi-spinner" 
      />
    </IconField>

    <!-- Results Popover -->
    <Popover 
      ref="popoverRef" 
      :dismissable="true"
      @hide="onPopoverHide"
      :pt="{
        root: { style: { width: popoverWidth + 'px', maxHeight: '24rem', overflow: 'auto' } }
      }"
    >
      <div class="flex flex-col">
        <!-- Results grouped by type -->
        <template v-if="suggestions.length > 0">
          <div v-for="group in suggestions" :key="group.label" class="mb-2">
            <!-- Group header -->
            <div class="flex items-center gap-2 px-3 py-2 font-semibold bg-surface-100 dark:bg-surface-800 sticky top-0">
              <i :class="['pi', group.icon, 'text-primary']"></i>
              <span class="text-primary">{{ group.label }}</span>
              <span class="text-xs text-primary/70 ml-auto font-normal">
                {{ group.items.length }}/{{ group.count }}
              </span>
            </div>
            <!-- Group items -->
            <ul class="list-none p-0 m-0">
              <li 
                v-for="item in group.items" 
                :key="item.uuid"
                class="flex flex-col gap-0.5 px-3 py-2 hover:bg-primary/10 cursor-pointer transition-colors"
                @click="onItemSelect(item)"
              >
                <span class="font-medium">{{ item.display }}</span>
                <span v-if="item.secondary" class="text-xs text-surface-400">{{ item.secondary }}</span>
              </li>
            </ul>
          </div>
        </template>

        <!-- Empty state -->
        <div v-else-if="searchQuery?.length >= 2 && !loading" class="px-4 py-3 text-surface-500 text-center">
          {{ $t('common.noResults') }}
        </div>

        <!-- Footer with total count -->
        <div v-if="totalCount > 0" class="px-4 py-2 text-xs text-primary border-t-2 border-primary text-center font-medium sticky bottom-0 bg-surface-0 dark:bg-surface-900">
          {{ $t('common.totalResults', { count: totalCount }) }}
        </div>
      </div>
    </Popover>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useTabsStore } from '@/stores/tabsStore'
import { useDebounceFn } from '@vueuse/core'
import api from '@/services/api'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Popover from 'primevue/popover'

const tabsStore = useTabsStore()

const containerRef = ref(null)
const inputRef = ref(null)
const popoverRef = ref(null)
const searchQuery = ref('')
const suggestions = ref([])
const loading = ref(false)
const totalCount = ref(0)
const isFocused = ref(false)
const popoverWidth = ref(400)

// Show popover when we have results
const showPopover = () => {
  if (popoverRef.value && inputRef.value?.$el) {
    // Calculate width based on input width
    popoverWidth.value = inputRef.value.$el.offsetWidth || 400
    popoverRef.value.show({ currentTarget: inputRef.value.$el })
  }
}

// Hide popover
const hidePopover = () => {
  popoverRef.value?.hide()
}

// Handle focus
const onFocus = () => {
  isFocused.value = true
  // Show popover if we already have results
  if (suggestions.value.length > 0) {
    showPopover()
  }
}

// Handle popover hide
const onPopoverHide = () => {
  // Only clear if input is not focused
  if (!isFocused.value) {
    searchQuery.value = ''
    suggestions.value = []
    totalCount.value = 0
  }
}

// Ticket type to tab configuration mapping
const TICKET_TYPE_CONFIG = {
  INCIDENT: { id: 'incidents', icon: 'pi pi-exclamation-triangle', labelKey: 'menu.incidents' },
  PROBLEM: { id: 'problems', icon: 'pi pi-question-circle', labelKey: 'menu.problems' },
  TASK: { id: 'tasks', icon: 'pi pi-check-square', labelKey: 'menu.tasks' },
  CHANGE: { id: 'changes', icon: 'pi pi-sync', labelKey: 'menu.changes' },
  KNOWLEDGE: { id: 'knowledge', icon: 'pi pi-book', labelKey: 'menu.knowledge' },
  USER_STORY: { id: 'user-stories', icon: 'pi pi-file', labelKey: 'menu.userStories' },
  PROJECT: { id: 'projects', icon: 'pi pi-folder', labelKey: 'menu.projects' },
  SPRINT: { id: 'sprints', icon: 'pi pi-bolt', labelKey: 'menu.sprints' },
  EPIC: { id: 'epics', icon: 'pi pi-bookmark', labelKey: 'menu.epics' },
  DEFECT: { id: 'defects', icon: 'pi pi-exclamation-circle', labelKey: 'menu.defects' },
  SERVICE_REQUEST: { id: 'service-requests', icon: 'pi pi-inbox', labelKey: 'menu.serviceRequests' },
}

// Object type to tab configuration mapping (non-ticket objects)
const OBJECT_CONFIG = {
  configuration_items: { id: 'configuration-items', icon: 'pi pi-cog', labelKey: 'configurationItems.title' },
  entities: { id: 'entities', icon: 'pi pi-building', labelKey: 'entities.title' },
  locations: { id: 'locations', icon: 'pi pi-map-marker', labelKey: 'locations.title' },
  groups: { id: 'groups', icon: 'pi pi-users', labelKey: 'groups.title' },
  persons: { id: 'persons', icon: 'pi pi-user', labelKey: 'persons.title' },
  symptoms: { id: 'symptoms', icon: 'pi pi-exclamation-circle', labelKey: 'symptoms.title' },
}

// Debounced search function
const doSearch = useDebounceFn(async (query) => {
  if (!query || query.length < 2) {
    suggestions.value = []
    totalCount.value = 0
    hidePopover()
    return
  }

  loading.value = true
  
  try {
    const response = await api.get('/global-search', {
      params: { q: query, limit: 5 }
    })
    
    suggestions.value = response.data.groups || []
    totalCount.value = response.data.totalCount || 0
    
    // Show popover if we have results
    if (suggestions.value.length > 0) {
      showPopover()
    } else {
      showPopover() // Show empty state
    }
  } catch (error) {
    console.error('Global search error:', error)
    suggestions.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}, 300)

// Handle input
const onInput = () => {
  doSearch(searchQuery.value?.trim())
}

// Handle item selection - open in new tab (popover stays open!)
const onItemSelect = (item) => {
  if (!item || !item.uuid || !item.objectType) return

  let parentTabConfig
  let ticketTypeCode = null
  let ciTypeUuid = null

  // Handle tickets specially - use ticket type for parent tab
  if (item.objectType === 'tickets') {
    ticketTypeCode = item.ticketTypeCode
    if (ticketTypeCode && TICKET_TYPE_CONFIG[ticketTypeCode]) {
      parentTabConfig = TICKET_TYPE_CONFIG[ticketTypeCode]
    } else {
      // Fallback for unknown ticket types
      parentTabConfig = { id: 'tickets', icon: 'pi pi-ticket', labelKey: 'tickets.title' }
    }
  } else {
    parentTabConfig = OBJECT_CONFIG[item.objectType]
    // For configuration items, capture ciTypeUuid
    if (item.objectType === 'configuration_items' && item.ciTypeUuid) {
      ciTypeUuid = item.ciTypeUuid
    }
  }

  if (!parentTabConfig) {
    console.warn('Unknown object type:', item.objectType)
    return
  }

  // First, ensure parent tab exists for this object type
  const parentTabId = parentTabConfig.id
  const existingParentTab = tabsStore.tabs.find(t => t.id === parentTabId && !t.parentId)
  
  if (!existingParentTab) {
    // Open parent tab first (the list view)
    tabsStore.openTab({
      id: parentTabId,
      labelKey: parentTabConfig.labelKey,
      icon: parentTabConfig.icon,
      objectType: item.objectType,
      component: 'ObjectsCrud',
      ticketTypeCode,
      ciTypeUuid,
    })
  }

  // Get the parent tab id_tab
  const parentTab = tabsStore.tabs.find(t => t.id === parentTabId && !t.parentId)
  if (!parentTab) {
    console.error('Failed to create parent tab')
    return
  }

  // Open child tab for the specific object
  tabsStore.openTab({
    id: `${item.objectType}-${item.uuid}`,
    label: item.display,
    icon: parentTabConfig.icon,
    objectType: item.objectType,
    objectId: item.uuid,
    parentId: parentTab.id_tab,
    component: 'ObjectView',
    mode: 'edit',
  })

  // Popover stays open - user can click more items!
}

// Handle keyboard shortcuts
const onKeydown = (event) => {
  if (event.key === 'Escape') {
    isFocused.value = false
    searchQuery.value = ''
    suggestions.value = []
    totalCount.value = 0
    hidePopover()
    inputRef.value?.$el?.blur()
  }
}

// Global Ctrl+F shortcut
const handleGlobalKeydown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
    event.preventDefault()
    inputRef.value?.$el?.focus()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>
