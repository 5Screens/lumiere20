<template>
  <div 
    class="global-search transition-all duration-300 ease-out"
    :class="isFocused ? 'w-full' : 'w-64'"
  >
    <AutoComplete
      ref="autocompleteRef"
      v-model="searchQuery"
      :suggestions="suggestions"
      :placeholder="$t('common.search')"
      :minLength="2"
      :delay="300"
      optionLabel="display"
      optionGroupLabel="label"
      optionGroupChildren="items"
      :loading="loading"
      fluid
      @complete="onSearch"
      @item-select="onItemSelect"
      @keydown="onKeydown"
      @focus="isFocused = true"
      @blur="onBlur"
      :pt="{
        root: { class: 'w-full' },
        input: { class: 'w-full' },
        overlay: { class: 'global-search-overlay' },
        option: { class: 'hover:!bg-primary/10 transition-colors' }
      }"
    >
      <template #optiongroup="{ option }">
        <div class="flex items-center gap-2 px-3 py-2 font-semibold">
          <i :class="['pi', option.icon, 'text-primary']"></i>
          <span class="text-primary">{{ option.label }}</span>
          <span class="text-xs text-primary/70 ml-auto font-normal">
            {{ option.items.length }}{{ option.count > option.items.length ? `/${option.count}` : '' }}
          </span>
        </div>
      </template>
      <template #option="{ option }">
        <div class="flex flex-col gap-0.5 px-3 py-2">
          <span class="font-medium">{{ option.display }}</span>
          <span v-if="option.secondary" class="text-xs text-surface-400">{{ option.secondary }}</span>
        </div>
      </template>
      <template #empty>
        <div class="px-4 py-3 text-surface-500 text-center">
          {{ searchQuery?.length >= 2 ? $t('common.noResults') : $t('common.typeToSearch') }}
        </div>
      </template>
      <template #footer v-if="totalCount > 0">
        <div class="px-4 py-2 text-xs text-primary border-t-2 border-primary text-center font-medium">
          {{ $t('common.totalResults', { count: totalCount }) }}
        </div>
      </template>
    </AutoComplete>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useTabsStore } from '@/stores/tabsStore'
import api from '@/services/api'
import AutoComplete from 'primevue/autocomplete'

const tabsStore = useTabsStore()

const autocompleteRef = ref(null)
const searchQuery = ref('')
const suggestions = ref([])
const loading = ref(false)
const totalCount = ref(0)
const isFocused = ref(false)

// Handle blur with delay to allow click on suggestions
const onBlur = () => {
  setTimeout(() => {
    isFocused.value = false
    // Clear search and close dropdown when focus is lost
    searchQuery.value = ''
    suggestions.value = []
    totalCount.value = 0
  }, 200)
}

// Object type to tab configuration mapping
const OBJECT_CONFIG = {
  tickets: { id: 'tickets', icon: 'pi pi-ticket', labelKey: 'tickets.title' },
  configuration_items: { id: 'configuration-items', icon: 'pi pi-cog', labelKey: 'configurationItems.title' },
  entities: { id: 'entities', icon: 'pi pi-building', labelKey: 'entities.title' },
  locations: { id: 'locations', icon: 'pi pi-map-marker', labelKey: 'locations.title' },
  groups: { id: 'groups', icon: 'pi pi-users', labelKey: 'groups.title' },
  persons: { id: 'persons', icon: 'pi pi-user', labelKey: 'persons.title' },
  symptoms: { id: 'symptoms', icon: 'pi pi-exclamation-circle', labelKey: 'symptoms.title' },
}

// Search handler
const onSearch = async (event) => {
  const query = event.query?.trim()
  
  if (!query || query.length < 2) {
    suggestions.value = []
    totalCount.value = 0
    return
  }

  loading.value = true
  
  try {
    const response = await api.get('/global-search', {
      params: { q: query, limit: 5 }
    })
    
    suggestions.value = response.data.groups || []
    totalCount.value = response.data.totalCount || 0
  } catch (error) {
    console.error('Global search error:', error)
    suggestions.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

// Handle item selection - open in new tab
const onItemSelect = (event) => {
  const item = event.value
  if (!item || !item.uuid || !item.objectType) return

  const config = OBJECT_CONFIG[item.objectType]
  if (!config) {
    console.warn('Unknown object type:', item.objectType)
    return
  }

  // First, ensure parent tab exists for this object type
  const parentTabId = config.id
  const existingParentTab = tabsStore.tabs.find(t => t.id === parentTabId && !t.parentId)
  
  if (!existingParentTab) {
    // Open parent tab first (the list view)
    tabsStore.openTab({
      id: parentTabId,
      label: config.labelKey,
      icon: config.icon,
      objectType: item.objectType,
      component: 'ObjectsCrud',
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
    icon: config.icon,
    objectType: item.objectType,
    objectId: item.uuid,
    parentId: parentTab.id_tab,
    component: 'ObjectView',
    mode: 'edit',
  })

  // Clear search after selection
  searchQuery.value = ''
  suggestions.value = []
  totalCount.value = 0
}

// Handle keyboard shortcuts
const onKeydown = (event) => {
  if (event.key === 'Escape') {
    searchQuery.value = ''
    suggestions.value = []
    autocompleteRef.value?.$el?.querySelector('input')?.blur()
  }
}

// Global Ctrl+F shortcut
const handleGlobalKeydown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
    event.preventDefault()
    autocompleteRef.value?.$el?.querySelector('input')?.focus()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>
