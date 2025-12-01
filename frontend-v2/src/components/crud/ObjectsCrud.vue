<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- Service not available message -->
    <div v-if="!serviceAvailable" class="flex-1 flex items-center justify-center">
      <div class="text-center p-8">
        <i class="pi pi-wrench text-5xl text-surface-400 mb-4" />
        <h3 class="text-xl font-semibold text-surface-600 dark:text-surface-300 mb-2">
          {{ $t('common.serviceNotAvailable') }}
        </h3>
        <p class="text-surface-500 dark:text-surface-400">
          {{ $t('common.serviceNotAvailableDesc', { type: objectType }) }}
        </p>
      </div>
    </div>

    <!-- Main content when service is available -->
    <template v-else>
      <!-- Context Menu -->
      <ContextMenu ref="cm" :model="menuModel" @hide="selectedItem = null" />
    
      <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
      <!-- Toolbar -->
      <Toolbar class="mb-4">
        <template #start>
          <ButtonGroup>
            <Button 
              :label="$t('common.create')" 
              icon="pi pi-plus" 
              severity="secondary" 
              @click="openCreateDialog" 
            />
            <Button 
              :label="$t('common.edit')" 
              icon="pi pi-pencil" 
              severity="secondary" 
              @click="openEditDialog(selectedItems[0])" 
              :disabled="!selectedItems || selectedItems.length !== 1" 
            />
            <Button 
              :label="$t('common.delete')" 
              icon="pi pi-trash" 
              severity="secondary" 
              @click="confirmDeleteSelected" 
              :disabled="!selectedItems || !selectedItems.length" 
            />
          </ButtonGroup>
        </template>

        <template #end>
          <Button 
            :label="$t('common.export')" 
            icon="pi pi-file-export" 
            severity="secondary" 
            @click="exportCSV" 
          />
        </template>
      </Toolbar>

      <!-- DataTable -->
      <DataTable
        ref="dt"
        v-model:selection="selectedItems"
        v-model:contextMenuSelection="selectedItem"
        v-model:filters="filters"
        v-model:sortField="sortField"
        v-model:sortOrder="sortOrder"
        :value="items"
        dataKey="uuid"
        :paginator="true"
        :rows="pageSize"
        :totalRecords="totalRecords"
        :lazy="true"
        :loading="loading"
        filterDisplay="menu"
        scrollable
        scrollHeight="flex"
        :globalFilterFields="['name', 'description']"
        resizableColumns
        columnResizeMode="expand"
        reorderableColumns
        :stateStorage="'local'"
        :stateKey="`${objectType}-table`"
        editMode="cell"
        @cellEditComplete="onCellEditComplete"
        contextMenu
        @page="onPage"
        @sort="onSort"
        @rowContextmenu="onRowContextMenu"
        @columnReorder="onColumnReorder"
        @stateRestore="onStateRestore"
        removableSort
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        :currentPageReportTemplate="paginationTemplate"
      >
        <!-- Header with search -->
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <IconField>
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText 
                  v-model="filters['global'].value" 
                  :placeholder="$t('common.search')" 
                />
              </IconField>
              <Button 
                type="button" 
                icon="pi pi-filter-slash" 
                severity="secondary" 
                @click="clearFilters" 
                :disabled="!hasActiveFilters" 
              />
              <!-- Column toggle popover -->
              <Popover ref="columnTogglePopover">
                <template #default>
                  <div class="p-4">
                    <div class="flex flex-col gap-2">
                      <div v-for="col of toggleableColumns" :key="col.field" class="flex items-center gap-2">
                        <Checkbox v-model="selectedColumns" :inputId="col.field" :value="col" />
                        <label :for="col.field">{{ col.header }}</label>
                      </div>
                    </div>
                  </div>
                </template>
              </Popover>
            </div>
            <div class="flex items-center gap-2">
              <Button 
                type="button" 
                icon="pi pi-cog" 
                severity="secondary" 
                @click="toggleColumnSelector" 
                v-tooltip.bottom="$t('common.columns')"
              />
              <Button 
                icon="pi pi-refresh" 
                severity="secondary" 
                @click="loadItems(1)" 
                :loading="loading" 
              />
            </div>
          </div>
        </template>

        <!-- Selection column -->
        <Column 
          field="_selection"
          selectionMode="multiple" 
          style="min-width: 3rem; width: 3rem" 
          :exportable="false" 
          :reorderableColumn="false"
          frozen 
        />
        
        <!-- Actions column -->
        <Column 
          field="_actions"
          style="min-width: 3rem; width: 3rem" 
          :exportable="false" 
          :reorderableColumn="false"
          frozen
        >
          <template #body="{ data }">
            <Button 
              icon="pi pi-pencil" 
              @click="openEditDialog(data)" 
              severity="secondary" 
              rounded 
              size="small" 
            />
          </template>
        </Column>

        <!-- Name column -->
        <Column 
          v-if="isColumnVisible('name')"
          field="name" 
          :header="$t('configurationItems.name')" 
          sortable 
          style="min-width: 16rem"
        >
          <template #body="{ data }">
            {{ data.name }}
          </template>
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" autofocus fluid />
          </template>
          <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" :placeholder="$t('common.search')" />
          </template>
        </Column>

        <!-- Type column -->
        <Column 
          v-if="isColumnVisible('ci_type')"
          field="ci_type" 
          :header="$t('configurationItems.ciType')" 
          sortable 
          style="min-width: 10rem"
        >
          <template #body="{ data }">
            <Tag :value="data.ci_type" :severity="getTypeSeverity(data.ci_type)" />
          </template>
          <template #editor="{ data, field }">
            <Select 
              v-model="data[field]" 
              :options="ciTypeOptions" 
              optionLabel="label" 
              optionValue="value" 
              autofocus 
              fluid 
            />
          </template>
          <template #filter="{ filterModel }">
            <Select 
              v-model="filterModel.value" 
              :options="ciTypeOptions" 
              optionLabel="label" 
              optionValue="value" 
              showClear
            >
              <template #option="slotProps">
                <Tag :value="slotProps.option.value" :severity="getTypeSeverity(slotProps.option.value)" />
              </template>
            </Select>
          </template>
        </Column>

        <!-- Description column -->
        <Column 
          v-if="isColumnVisible('description')"
          field="description" 
          :header="$t('configurationItems.description')" 
          sortable 
          style="min-width: 20rem"
        >
          <template #body="{ data }">
            <span class="block max-w-xs truncate">{{ data.description || '-' }}</span>
          </template>
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" autofocus fluid />
          </template>
          <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" :placeholder="$t('common.search')" />
          </template>
        </Column>

        <!-- Created at column -->
        <Column 
          v-if="isColumnVisible('created_at')"
          field="created_at" 
          :header="$t('configurationItems.createdAt')" 
          sortable 
          dataType="date" 
          style="min-width: 12rem"
        >
          <template #body="{ data }">
            {{ formatDate(data.created_at) }}
          </template>
          <template #filter="{ filterModel }">
            <DatePicker v-model="filterModel.value" dateFormat="dd/mm/yy" showButtonBar />
          </template>
        </Column>

        <!-- Updated at column -->
        <Column 
          v-if="isColumnVisible('updated_at')"
          field="updated_at" 
          :header="$t('configurationItems.updatedAt')" 
          sortable 
          dataType="date" 
          style="min-width: 12rem"
        >
          <template #body="{ data }">
            {{ formatDate(data.updated_at) }}
          </template>
          <template #filter="{ filterModel }">
            <DatePicker v-model="filterModel.value" dateFormat="dd/mm/yy" showButtonBar />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog 
      v-model:visible="itemDialog" 
      :style="{ width: '500px' }" 
      :header="dialogMode === 'create' ? $t('configurationItems.dialog.createTitle') : $t('configurationItems.dialog.editTitle')" 
      :modal="true"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label for="name" class="font-semibold">{{ $t('configurationItems.name') }} *</label>
          <InputText id="name" v-model="editItem.name" autofocus fluid />
        </div>
        <div class="flex flex-col gap-2">
          <label for="ci_type" class="font-semibold">{{ $t('configurationItems.ciType') }}</label>
          <Select 
            id="ci_type" 
            v-model="editItem.ci_type" 
            :options="ciTypeOptions" 
            optionLabel="label" 
            optionValue="value" 
            fluid 
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="description" class="font-semibold">{{ $t('configurationItems.description') }}</label>
          <Textarea id="description" v-model="editItem.description" rows="3" fluid />
        </div>
      </div>
      <template #footer>
        <Button :label="$t('common.cancel')" icon="pi pi-times" severity="secondary" text @click="itemDialog = false" />
        <Button :label="$t('common.save')" icon="pi pi-check" @click="saveItem" :loading="saving" />
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog 
      v-model:visible="deleteDialog" 
      :style="{ width: '450px' }" 
      :header="$t('configurationItems.dialog.deleteTitle')" 
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-3xl text-orange-500" />
        <span v-if="selectedItems?.length === 1">
          {{ $t('configurationItems.dialog.deleteMessage') }}
        </span>
        <span v-else>
          {{ $t('configurationItems.dialog.deleteMultipleMessage', { count: selectedItems?.length }) }}
        </span>
      </div>
      <template #footer>
        <Button :label="$t('common.no')" icon="pi pi-times" severity="secondary" text @click="deleteDialog = false" />
        <Button :label="$t('common.yes')" icon="pi pi-check" severity="danger" @click="deleteSelectedItems" :loading="deleting" />
      </template>
    </Dialog>

    <!-- Toast -->
    <Toast position="bottom-right" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { FilterMatchMode, FilterOperator } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { getService, hasService } from '@/services'
import { getObjectTypeConfig } from '@/config/objectTypes'

// PrimeVue components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Toast from 'primevue/toast'
import ContextMenu from 'primevue/contextmenu'
import DatePicker from 'primevue/datepicker'
import Popover from 'primevue/popover'
import Checkbox from 'primevue/checkbox'

// Props
const props = defineProps({
  objectType: {
    type: String,
    required: true
  },
  tabId: {
    type: String,
    default: null
  }
})

// Get service and config for this object type
const service = computed(() => getService(props.objectType))
const config = computed(() => getObjectTypeConfig(props.objectType))
const serviceAvailable = computed(() => hasService(props.objectType))

// Composables
const toast = useToast()
const { t, locale } = useI18n()

// Refs
const dt = ref()
const cm = ref()
const columnTogglePopover = ref()
const items = ref([])
const selectedItems = ref([])
const selectedItem = ref(null)
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

// Pagination
const totalRecords = ref(0)
const currentPage = ref(1)
const pageSize = 25
const sortField = ref('updated_at')
const sortOrder = ref(-1)

// Dialogs
const itemDialog = ref(false)
const deleteDialog = ref(false)
const dialogMode = ref('create')
const editItem = ref({})

// Filters
const initFilters = () => ({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
  ci_type: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
  description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
  created_at: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
  updated_at: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] }
})

const filters = ref(initFilters())

// Options
const ciTypeOptions = [
  { label: 'UPS', value: 'UPS' },
  { label: 'Application', value: 'APPLICATION' },
  { label: 'Server', value: 'SERVER' },
  { label: 'Network Device', value: 'NETWORK_DEVICE' },
  { label: 'Generic', value: 'GENERIC' }
]

// Context menu
const menuModel = ref([
  { label: t('common.edit'), icon: 'pi pi-pencil', command: () => openEditDialog(selectedItem.value) },
  { label: t('common.delete'), icon: 'pi pi-trash', command: () => confirmDeleteSelected() }
])

// Column toggle
const toggleableColumns = computed(() => [
  { field: 'name', header: t('configurationItems.name') },
  { field: 'ci_type', header: t('configurationItems.ciType') },
  { field: 'description', header: t('configurationItems.description') },
  { field: 'created_at', header: t('configurationItems.createdAt') },
  { field: 'updated_at', header: t('configurationItems.updatedAt') }
])

const selectedColumns = ref([...toggleableColumns.value])

const isColumnVisible = (field) => {
  return selectedColumns.value.some(col => col.field === field)
}

const toggleColumnSelector = (event) => {
  columnTogglePopover.value.toggle(event)
}

// Computed
const hasActiveFilters = computed(() => {
  if (filters.value.global?.value) return true
  const columnFilters = ['name', 'ci_type', 'description', 'created_at', 'updated_at']
  for (const field of columnFilters) {
    const filter = filters.value[field]
    if (filter?.constraints) {
      for (const constraint of filter.constraints) {
        if (constraint.value !== null && constraint.value !== undefined && constraint.value !== '') {
          return true
        }
      }
    }
  }
  return false
})

const paginationTemplate = computed(() => {
  const templates = {
    fr: 'Affichage de {first} à {last} sur {totalRecords} éléments',
    en: 'Showing {first} to {last} of {totalRecords} items'
  }
  return templates[locale.value] || templates.en
})

// Methods
const loadItems = async (pageNum = null) => {
  if (!service.value) {
    console.warn(`[ObjectsCrud] No service available for objectType: ${props.objectType}`)
    return
  }
  
  try {
    loading.value = true
    const page = typeof pageNum === 'number' ? pageNum : currentPage.value
    const result = await service.value.search({
      filters: filters.value,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      page,
      limit: pageSize
    })
    items.value = result.data || []
    totalRecords.value = result.total || 0
    if (typeof pageNum === 'number') currentPage.value = pageNum
  } catch (error) {
    console.error('Failed to load items:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load items', life: 3000 })
  } finally {
    loading.value = false
  }
}

const onPage = (event) => {
  loadItems(event.page + 1)
}

const onSort = () => {
  currentPage.value = 1
  loadItems(1)
}

const clearFilters = () => {
  filters.value = initFilters()
}

const openCreateDialog = () => {
  editItem.value = { name: '', ci_type: 'GENERIC', description: '' }
  dialogMode.value = 'create'
  itemDialog.value = true
}

const openEditDialog = (data) => {
  editItem.value = { ...data }
  dialogMode.value = 'edit'
  itemDialog.value = true
}

const saveItem = async () => {
  if (!editItem.value.name?.trim()) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Name is required', life: 3000 })
    return
  }

  try {
    saving.value = true
    const translationPrefix = config.value?.translationPrefix || 'common'
    if (dialogMode.value === 'create') {
      await service.value.create(editItem.value)
      toast.add({ severity: 'success', summary: 'Success', detail: t(`${translationPrefix}.messages.created`), life: 3000 })
    } else {
      await service.value.update(editItem.value.uuid, editItem.value)
      toast.add({ severity: 'success', summary: 'Success', detail: t(`${translationPrefix}.messages.updated`), life: 3000 })
    }
    itemDialog.value = false
    await loadItems()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save item', life: 3000 })
  } finally {
    saving.value = false
  }
}

const confirmDeleteSelected = () => {
  deleteDialog.value = true
}

const deleteSelectedItems = async () => {
  try {
    deleting.value = true
    const uuids = selectedItems.value.map(item => item.uuid)
    const translationPrefix = config.value?.translationPrefix || 'common'
    await service.value.deleteMany(uuids)
    toast.add({ 
      severity: 'success', 
      summary: 'Success', 
      detail: t(`${translationPrefix}.messages.deletedMultiple`, { count: uuids.length }), 
      life: 3000 
    })
    deleteDialog.value = false
    selectedItems.value = []
    await loadItems()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete items', life: 3000 })
  } finally {
    deleting.value = false
  }
}

const onCellEditComplete = async (event) => {
  const { data, newValue, field } = event
  if (data[field] === newValue) return

  try {
    const translationPrefix = config.value?.translationPrefix || 'common'
    await service.value.update(data.uuid, { [field]: newValue })
    data[field] = newValue
    toast.add({ severity: 'success', summary: 'Success', detail: t(`${translationPrefix}.messages.updated`), life: 3000 })
  } catch (error) {
    event.preventDefault()
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update item', life: 3000 })
  }
}

const onRowContextMenu = (event) => {
  cm.value.show(event.originalEvent)
}

const exportCSV = () => {
  dt.value.exportCSV()
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const getTypeSeverity = (type) => {
  switch (type) {
    case 'UPS': return 'warn'
    case 'APPLICATION': return 'success'
    case 'SERVER': return 'info'
    case 'NETWORK_DEVICE': return 'secondary'
    default: return null
  }
}

const onColumnReorder = (event) => {
  console.log('[ObjectsCrud] Column reorder event:', event)
}

const onStateRestore = (event) => {
  console.log('[ObjectsCrud] State restored:', event)
  // Clear saved state if it causes issues with frozen columns
  // The frozen columns should always stay in position
}

// Watch filters with debounce
let searchTimeout = null
watch(filters, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadItems(1)
  }, 300)
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadItems(1)
})
</script>

<style scoped>
:deep(.p-datatable) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:deep(.p-datatable-wrapper) {
  flex: 1;
  min-height: 0;
}

:deep(.p-toolbar) {
  border: none;
  background: transparent;
  padding: 0;
}
</style>
