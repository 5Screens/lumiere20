<template>
  <section class="flex flex-col gap-6 p-6 h-full overflow-y-auto">
    <!-- Header & Toolbar -->
    <header class="flex flex-col gap-5">
      <div class="flex flex-col gap-2">
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 flex items-center gap-3">
          <i class="pi pi-globe text-primary"></i>
          {{ t('portals.page_title') }}
        </h1>
        <p class="text-surface-500">{{ t('portals.page_subtitle') }}</p>
      </div>
      
      <div class="flex gap-3 flex-wrap items-center">
        <!-- Search -->
        <IconField class="flex-1 min-w-64 max-w-96">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            :placeholder="t('portals.search_placeholder')"
            class="w-full"
            @input="debouncedSearch"
          />
        </IconField>
        
        <!-- Filter by status -->
        <Select
          v-model="stateFilter"
          :options="filterOptions"
          optionLabel="label"
          optionValue="value"
          class="w-40"
          @change="fetchData"
        />
        
        <!-- Refresh button -->
        <Button
          :label="t('portals.refresh')"
          icon="pi pi-refresh"
          :loading="loading"
          @click="fetchData"
        />
      </div>
    </header>

    <!-- Loading state -->
    <div v-if="loading && !items.length" class="flex-1">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden animate-pulse">
          <div class="w-full h-44 bg-surface-200 dark:bg-surface-700"></div>
          <div class="p-4 flex flex-col gap-3">
            <div class="h-5 bg-surface-200 dark:bg-surface-700 rounded w-3/4"></div>
            <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full"></div>
            <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && !items.length" class="flex-1 flex flex-col items-center justify-center gap-4 py-16 text-surface-400">
      <i class="pi pi-globe text-6xl opacity-30"></i>
      <h2 class="text-xl font-semibold text-surface-700 dark:text-surface-300">{{ t('portals.empty_title') }}</h2>
      <p class="text-surface-500">{{ t('portals.empty_message') }}</p>
    </div>

    <!-- Grid of portals -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <PortalCard
        v-for="portal in items"
        :key="portal.uuid"
        :portal="portal"
        :loading-action="!!toggling[portal.uuid]"
        @toggle="onToggle(portal)"
        @admin="onAdminClick(portal)"
      />
    </div>

    <!-- Stats footer -->
    <footer v-if="items.length" class="pt-5 border-t border-surface-200 dark:border-surface-700">
      <div class="flex gap-6 flex-wrap">
        <span class="flex items-center gap-2 text-surface-500 font-medium">
          <i class="pi pi-list text-primary"></i>
          {{ t('portals.total_count', { count: items.length }) }}
        </span>
        <span class="flex items-center gap-2 text-surface-500 font-medium">
          <i class="pi pi-check-circle text-green-500"></i>
          {{ t('portals.active_count', { count: activeCount }) }}
        </span>
        <span class="flex items-center gap-2 text-surface-500 font-medium">
          <i class="pi pi-times-circle text-surface-400"></i>
          {{ t('portals.inactive_count', { count: inactiveCount }) }}
        </span>
      </div>
    </footer>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTabsStore } from '@/stores/tabsStore'
import portalsService from '@/services/portalsService'
import PortalCard from './PortalCard.vue'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'
import Button from 'primevue/button'

const props = defineProps({
  tabId: {
    type: String,
    required: true
  }
})

const { t } = useI18n()
const tabsStore = useTabsStore()

// State
const loading = ref(false)
const items = ref([])
const searchQuery = ref('')
const stateFilter = ref('all')
const toggling = ref({})

// Filter options
const filterOptions = computed(() => [
  { label: t('portals.filter_all'), value: 'all' },
  { label: t('portals.filter_active'), value: 'active' },
  { label: t('portals.filter_inactive'), value: 'inactive' }
])

// Debounce timer
let searchTimeout = null

// Computed
const activeCount = computed(() => items.value.filter(p => p.is_active).length)
const inactiveCount = computed(() => items.value.filter(p => !p.is_active).length)

// Methods
const fetchData = async () => {
  loading.value = true
  try {
    const params = {}
    
    // Apply state filter
    if (stateFilter.value === 'active') {
      params.is_active = true
    } else if (stateFilter.value === 'inactive') {
      params.is_active = false
    }
    
    // Apply search query
    if (searchQuery.value.trim()) {
      params.q = searchQuery.value.trim()
    }
    
    console.info('[ADMIN PORTALS] Fetching portals with params:', params)
    const data = await portalsService.listPortals(params)
    items.value = Array.isArray(data) ? data : []
    console.info(`[ADMIN PORTALS] Loaded ${items.value.length} portals`)
  } catch (error) {
    console.error('[ADMIN PORTALS] Error fetching portals:', error)
    items.value = []
  } finally {
    loading.value = false
  }
}

const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    fetchData()
  }, 300)
}

const onToggle = async (portal) => {
  const nextState = !portal.is_active
  const previousState = portal.is_active
  
  // Set loading state
  toggling.value[portal.uuid] = true
  
  // Optimistic update
  portal.is_active = nextState
  
  try {
    console.info(`[ADMIN PORTALS] Toggling portal ${portal.code} to ${nextState}`)
    await portalsService.toggleActive(portal.uuid, nextState)
    console.info(`[ADMIN PORTALS] Portal ${portal.code} toggled successfully`)
  } catch (error) {
    // Rollback on error
    portal.is_active = previousState
    console.error('[ADMIN PORTALS] Error toggling portal:', error)
  } finally {
    toggling.value[portal.uuid] = false
  }
}

const onAdminClick = (portal) => {
  console.info(`[ADMIN PORTALS] Opening admin form for portal: ${portal.name}`)
  
  // Open a child tab with the portal admin form
  tabsStore.openTab({
    id: `portal-admin-${portal.uuid}`,
    objectId: portal.uuid,
    objectType: 'portal',
    parentId: props.tabId,
    label: portal.name,
    icon: 'pi pi-cog',
    component: 'PortalAdminForm'
  })
}

// Lifecycle
onMounted(() => {
  console.info('[ADMIN PORTALS] Component mounted, fetching data')
  fetchData()
})
</script>
