<template>
  <div class="reverse-link-mn p-4 flex flex-col h-full">
    <!-- Header with title and counter -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-200">
        {{ t(field.label_key) }}
      </h3>
      <span class="text-sm text-surface-500 dark:text-surface-400">
        {{ t('common.mnSelectedCount', { selected: selectedUuids.size, total: totalRecords }) }}
      </span>
    </div>

    <!-- Toolbar: search + filters + actions -->
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <!-- Search input -->
      <IconField class="flex-1 min-w-[200px]">
        <InputIcon class="pi pi-search" />
        <InputText 
          v-model="searchQuery" 
          :placeholder="t('common.search')" 
          size="small"
          class="w-full"
        />
      </IconField>

      <!-- Filter buttons -->
      <SelectButton 
        v-model="filterMode" 
        :options="filterOptions" 
        optionLabel="label" 
        optionValue="value"
        size="small"
        :allowEmpty="true"
      />

      <!-- Select all / Deselect all -->
      <Button 
        :label="t('common.mnSelectAll')" 
        size="small" 
        severity="secondary" 
        outlined
        @click="selectAllPage"
      />
      <Button 
        :label="t('common.mnDeselectAll')" 
        size="small" 
        severity="secondary" 
        outlined
        @click="deselectAllPage"
      />
    </div>

    <!-- Loading state -->
    <div v-if="initialLoading" class="flex items-center justify-center py-8">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- Items list with checkboxes -->
    <div v-else class="overflow-hidden flex-1 min-h-0 flex flex-col">
      <!-- Context Menu -->
      <ContextMenu ref="cm" :model="contextMenuItems" />

      <DataTable 
        :value="items" 
        :scrollable="true"
        scrollHeight="flex"
        stripedRows
        rowHover
        size="small"
        class="p-datatable-sm flex-1"
        :lazy="true"
        :paginator="true"
        :rows="pageSize"
        :totalRecords="totalRecords"
        :loading="loading"
        v-model:first="first"
        :sortField="sortField"
        :sortOrder="sortOrder"
        :pt="{ bodyRow: { class: 'cursor-pointer' } }"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        :currentPageReportTemplate="`{first} - {last} / {totalRecords}`"
        contextMenu
        @page="onPage"
        @sort="onSort"
        @row-click="toggleItem($event.data)"
        @rowContextmenu="onRowContextMenu"
      >
        <!-- Checkbox column -->
        <Column header="" style="width: 50px">
          <template #body="{ data }">
            <div @click.stop>
              <Checkbox 
                :modelValue="selectedUuids.has(data.uuid)"
                :binary="true"
                @update:modelValue="toggleItem(data)"
              />
            </div>
          </template>
        </Column>

        <!-- Dynamic columns based on relation_display -->
        <Column 
          v-for="col in displayColumns" 
          :key="col.field"
          :field="col.field" 
          :header="col.header"
          :style="{ minWidth: col.minWidth }"
          sortable
        >
          <template #body="{ data }">
            <span v-if="col.type === 'date'">{{ formatDate(data[col.field]) }}</span>
            <span v-else-if="typeof data[col.field] === 'boolean'">{{ data[col.field] ? 'true' : 'false' }}</span>
            <span v-else-if="data[col.field] && typeof data[col.field] === 'object'">{{ data[col.field].name || data[col.field].label || data[col.field].code || '-' }}</span>
            <span v-else>{{ data[col.field] ?? '-' }}</span>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Action buttons: Confirm / Revert -->
    <div v-if="hasChanges" class="flex items-center justify-end gap-2 mt-4">
      <span class="text-sm text-orange-500 mr-2">
        <i class="pi pi-exclamation-circle mr-1" />
        {{ t('common.mnUnsavedChanges') }}
      </span>
      <Button 
        :label="t('common.mnRevert')" 
        icon="pi pi-undo" 
        size="small" 
        severity="secondary" 
        outlined
        @click="revert"
      />
      <Button 
        :label="t('common.mnConfirm')" 
        icon="pi pi-check" 
        size="small" 
        severity="success"
        :loading="saving"
        @click="confirmChanges"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useTabsStore } from '@/stores/tabsStore'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import SelectButton from 'primevue/selectbutton'
import ProgressSpinner from 'primevue/progressspinner'
import ContextMenu from 'primevue/contextmenu'
import api from '@/services/api'

const props = defineProps({
  field: {
    type: Object,
    required: true
  },
  parentUuid: {
    type: String,
    required: true
  },
  parentType: {
    type: String,
    required: true
  },
  tabId: {
    type: String,
    default: null
  }
})

const { t, locale } = useI18n()
const toast = useToast()
const tabsStore = useTabsStore()

// State
const initialLoading = ref(false)
const loading = ref(false)
const saving = ref(false)
const items = ref([])
const totalRecords = ref(0)
const selectedUuids = ref(new Set())
const originalUuids = ref(new Set())
const searchQuery = ref('')
const filterMode = ref(null)
const first = ref(0)
const pageSize = ref(25)
const sortField = ref(null)
const sortOrder = ref(1)

// Context menu
const cm = ref(null)
const contextItem = ref(null)

// Debounce timer for search
let searchDebounce = null

// Filter options
const filterOptions = computed(() => [
  { label: t('common.mnFilterSelected'), value: 'selected' },
  { label: t('common.mnFilterNotSelected'), value: 'not_selected' }
])

// Context menu items
const contextMenuItems = computed(() => [
  {
    label: t('common.edit'),
    icon: 'pi pi-pencil',
    command: () => openItemInTab(contextItem.value)
  }
])

// Get the object type label key prefix
const objectLabelPrefix = computed(() => {
  const objectType = props.field.relation_object
  return objectType.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
})

// Parse display columns from relation_display
const displayColumns = computed(() => {
  const displayFields = props.field.relation_display?.split(',') || ['name']
  return displayFields.map(field => {
    const fieldName = field.trim()
    const isDate = ['start_date', 'end_date', 'created_at', 'updated_at'].includes(fieldName)
    const camelFieldName = fieldName.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    return {
      field: fieldName,
      header: t(`${objectLabelPrefix.value}.${camelFieldName}`),
      type: isDate ? 'date' : 'text',
      minWidth: isDate ? '120px' : '150px'
    }
  })
})

// Primary display field for search
const primaryField = computed(() => {
  const fields = props.field.relation_display?.split(',') || ['name']
  return fields[0].trim()
})

// Check if there are unsaved changes
const hasChanges = computed(() => {
  if (selectedUuids.value.size !== originalUuids.value.size) return true
  for (const uuid of selectedUuids.value) {
    if (!originalUuids.value.has(uuid)) return true
  }
  for (const uuid of originalUuids.value) {
    if (!selectedUuids.value.has(uuid)) return true
  }
  return false
})

// Get the API endpoint for the relation object
const getApiEndpoint = () => {
  const objectType = props.field.relation_object
  return '/' + objectType.replace(/_/g, '-')
}

// Build the sync URL by replacing {parentUuid} placeholder
const getSyncUrl = () => {
  return props.field.sync_url.replace('{parentUuid}', props.parentUuid)
}

// Build search filters for the API
const buildSearchFilters = () => {
  const filters = {}
  if (searchQuery.value.trim()) {
    filters[primaryField.value] = { value: searchQuery.value.trim(), matchMode: 'contains' }
  }
  if (filterMode.value === 'selected') {
    filters.uuid = { value: [...selectedUuids.value], matchMode: 'in' }
  } else if (filterMode.value === 'not_selected') {
    filters.uuid = { value: [...selectedUuids.value], matchMode: 'notIn' }
  }
  return filters
}

// Fetch a page of items from the server
const fetchItems = async () => {
  loading.value = true
  try {
    const endpoint = getApiEndpoint()
    const page = Math.floor(first.value / pageSize.value) + 1
    const response = await api.post(`${endpoint}/search`, {
      filters: buildSearchFilters(),
      page,
      limit: pageSize.value,
      sortField: sortField.value || primaryField.value,
      sortOrder: sortOrder.value
    })
    items.value = response.data?.data || response.data || []
    totalRecords.value = response.data?.total ?? items.value.length
  } catch (error) {
    console.error(`Error fetching ${props.field.relation_object}:`, error)
  } finally {
    loading.value = false
  }
}

// Load linked items and initial page
const loadData = async () => {
  if (!props.parentUuid) return

  initialLoading.value = true
  try {
    const endpoint = getApiEndpoint()

    // Load currently linked items using the relation_filter
    const linkedResponse = await api.post(`${endpoint}/search`, {
      filters: {
        [props.field.relation_filter]: { value: props.parentUuid, matchMode: 'equals' }
      },
      first: 0,
      rows: 10000,
      sortField: primaryField.value,
      sortOrder: 1
    })
    const linkedItems = linkedResponse.data?.data || linkedResponse.data || []
    const linkedSet = new Set(linkedItems.map(item => item.uuid))

    selectedUuids.value = new Set(linkedSet)
    originalUuids.value = new Set(linkedSet)

    // Fetch first page
    await fetchItems()
  } catch (error) {
    console.error(`Error loading ${props.field.relation_object}:`, error)
    toast.add({ severity: 'error', summary: 'Error', detail: `Failed to load ${props.field.relation_object}`, life: 3000 })
  } finally {
    initialLoading.value = false
  }
}

// Pagination handler
const onPage = (event) => {
  first.value = event.first
  pageSize.value = event.rows
  fetchItems()
}

// Sort handler
const onSort = (event) => {
  sortField.value = event.sortField
  sortOrder.value = event.sortOrder
  first.value = 0
  fetchItems()
}

// Context menu handler
const onRowContextMenu = (event) => {
  contextItem.value = event.data
  cm.value.show(event.originalEvent)
}

// Open item in a new tab
const openItemInTab = (data) => {
  if (!data) return
  const objectType = props.field.relation_object
  const displayName = data[primaryField.value] || data.uuid?.substring(0, 8)
  const rootParentId = tabsStore.getRootParentId(props.tabId)
  if (!rootParentId) return

  tabsStore.openTab({
    id: `${objectType}-edit-${data.uuid}`,
    label: displayName,
    icon: 'pi pi-file',
    component: 'ObjectView',
    objectType: objectType,
    objectId: data.uuid,
    parentId: rootParentId,
    mode: 'edit'
  })
}

// Toggle item selection
const toggleItem = (item) => {
  const newSet = new Set(selectedUuids.value)
  if (newSet.has(item.uuid)) {
    newSet.delete(item.uuid)
  } else {
    newSet.add(item.uuid)
  }
  selectedUuids.value = newSet
}

// Select all items on current page
const selectAllPage = () => {
  const newSet = new Set(selectedUuids.value)
  items.value.forEach(item => newSet.add(item.uuid))
  selectedUuids.value = newSet
}

// Deselect all items on current page
const deselectAllPage = () => {
  const newSet = new Set(selectedUuids.value)
  items.value.forEach(item => newSet.delete(item.uuid))
  selectedUuids.value = newSet
}

// Revert to original state
const revert = () => {
  selectedUuids.value = new Set(originalUuids.value)
}

// Confirm changes: compute diff and call link/unlink APIs
const confirmChanges = async () => {
  saving.value = true
  try {
    const syncUrl = getSyncUrl()

    // Compute added and removed
    const toAdd = []
    const toRemove = []

    for (const uuid of selectedUuids.value) {
      if (!originalUuids.value.has(uuid)) toAdd.push(uuid)
    }
    for (const uuid of originalUuids.value) {
      if (!selectedUuids.value.has(uuid)) toRemove.push(uuid)
    }

    // Call sync API on the parent object
    if (toAdd.length > 0 || toRemove.length > 0) {
      await api.post(syncUrl, {
        add: toAdd,
        remove: toRemove
      })
    }

    // Update original state
    originalUuids.value = new Set(selectedUuids.value)

    toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.mnSaved'), life: 3000 })
  } catch (error) {
    console.error(`Error saving ${props.field.relation_object} links:`, error)
    toast.add({ severity: 'error', summary: 'Error', detail: t('common.mnSaveFailed'), life: 3000 })
  } finally {
    saving.value = false
  }
}

// Format date
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value)
}

// Expose hasChanges, confirmChanges, revert for parent ObjectView
defineExpose({
  hasChanges,
  confirmChanges,
  revert,
  saving
})

// Watch for parent changes
watch(() => props.parentUuid, () => {
  loadData()
}, { immediate: true })

// Watch search query with debounce
watch(searchQuery, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    first.value = 0
    fetchItems()
  }, 400)
})

// Watch filter mode changes
watch(filterMode, () => {
  first.value = 0
  fetchItems()
})
</script>

