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
              @click="openEditInTab(selectedItems[0])" 
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

        <!-- Dynamic columns from metadata -->
        <template v-for="col in tableColumns" :key="col.field_name">
        <Column 
          v-if="isColumnVisible(col.field_name)"
          :field="col.field_name" 
          :header="$t(col.label_key)" 
          :sortable="col.is_sortable"
          :dataType="col.data_type === 'date' ? 'date' : undefined"
          :style="col.min_width ? `min-width: ${col.min_width}` : undefined"
        >
          <!-- Body template based on field type -->
          <template #body="{ data }">
            <!-- Boolean -->
            <template v-if="col.field_type === 'boolean'">
              <i :class="data[col.field_name] ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" />
            </template>
            <!-- Select with Tag and color -->
            <template v-else-if="col.field_type === 'select'">
              <Tag 
                :value="formatCellValue(data[col.field_name], col)"
                :style="getTagStyle(getOptionByValue(col, data[col.field_name])?.color)"
              >
                <template #default>
                  <div class="flex items-center gap-2">
                    <i 
                      v-if="getOptionByValue(col, data[col.field_name])?.icon" 
                      :class="['pi', getOptionByValue(col, data[col.field_name])?.icon]" 
                    />
                    <span>{{ formatCellValue(data[col.field_name], col) }}</span>
                  </div>
                </template>
              </Tag>
            </template>
            <!-- Date/Datetime -->
            <template v-else-if="col.field_type === 'datetime' || col.field_type === 'date'">
              {{ formatDate(data[col.field_name]) }}
            </template>
            <!-- Textarea (truncated) -->
            <template v-else-if="col.field_type === 'textarea'">
              <span class="block max-w-xs truncate">{{ data[col.field_name] || '-' }}</span>
            </template>
            <!-- Tag Style display -->
            <template v-else-if="col.field_type === 'tag_style'">
              <Tag 
                v-if="data[col.field_name]"
                :style="getTagStyle(data[col.field_name])"
              >
                {{ data[col.field_name] }}
              </Tag>
              <span v-else>-</span>
            </template>
            <!-- Icon display -->
            <template v-else-if="col.field_type === 'icon_picker'">
              <div v-if="data[col.field_name]" class="flex items-center gap-2">
                <i :class="`pi ${data[col.field_name]}`" />
                <span class="text-sm text-surface-500">{{ data[col.field_name] }}</span>
              </div>
              <span v-else>-</span>
            </template>
            <!-- Default text -->
            <template v-else>
              {{ data[col.field_name] ?? '-' }}
            </template>
          </template>
          
          <!-- Editor template (only for editable fields) -->
          <template v-if="col.is_editable" #editor="{ data, field }">
            <!-- Select editor -->
            <template v-if="col.field_type === 'select'">
              <Select 
                v-model="data[field]" 
                :options="getFieldOptions(col)" 
                optionLabel="label" 
                optionValue="value" 
                autofocus 
                fluid 
              >
                <template #value="slotProps">
                  <div 
                    v-if="slotProps.value" 
                    class="flex items-center gap-2 px-2 py-1 rounded"
                    :style="getTagStyle(getOptionByValue(col, slotProps.value)?.color)"
                  >
                    <i 
                      v-if="getOptionByValue(col, slotProps.value)?.icon" 
                      :class="['pi', getOptionByValue(col, slotProps.value)?.icon]" 
                    />
                    <span>{{ getOptionByValue(col, slotProps.value)?.label }}</span>
                  </div>
                </template>
                <template #option="slotProps">
                  <div 
                    class="flex items-center gap-2 px-2 py-1 rounded"
                    :style="getTagStyle(slotProps.option.color)"
                  >
                    <i 
                      v-if="slotProps.option.icon" 
                      :class="['pi', slotProps.option.icon]" 
                    />
                    <span>{{ slotProps.option.label }}</span>
                  </div>
                </template>
              </Select>
            </template>
            <!-- Boolean editor -->
            <template v-else-if="col.field_type === 'boolean'">
              <ToggleSwitch v-model="data[field]" />
            </template>
            <!-- Number editor -->
            <template v-else-if="col.field_type === 'number'">
              <InputNumber v-model="data[field]" autofocus fluid />
            </template>
            <!-- Default text editor -->
            <template v-else>
              <InputText v-model="data[field]" autofocus fluid />
            </template>
          </template>
          
          <!-- Filter template (only for filterable fields) -->
          <template v-if="col.is_filterable" #filter="{ filterModel }">
            <!-- Select filter -->
            <template v-if="col.field_type === 'select'">
              <Select 
                v-model="filterModel.value" 
                :options="getFieldOptions(col)" 
                optionLabel="label" 
                optionValue="value" 
                showClear
              >
                <template #option="slotProps">
                  <div 
                    class="flex items-center gap-2 px-2 py-1 rounded"
                    :style="getTagStyle(slotProps.option.color)"
                  >
                    <i 
                      v-if="slotProps.option.icon" 
                      :class="['pi', slotProps.option.icon]" 
                    />
                    <span>{{ slotProps.option.label }}</span>
                  </div>
                </template>
              </Select>
            </template>
            <!-- Date filter -->
            <template v-else-if="col.field_type === 'datetime' || col.field_type === 'date'">
              <DatePicker v-model="filterModel.value" dateFormat="dd/mm/yy" showButtonBar />
            </template>
            <!-- Boolean filter -->
            <template v-else-if="col.field_type === 'boolean'">
              <Select 
                v-model="filterModel.value" 
                :options="[{ label: $t('common.yes'), value: true }, { label: $t('common.no'), value: false }]" 
                optionLabel="label" 
                optionValue="value" 
                showClear
              />
            </template>
            <!-- Default text filter -->
            <template v-else>
              <InputText v-model="filterModel.value" type="text" :placeholder="$t('common.search')" />
            </template>
          </template>
        </Column>
        </template>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog with dynamic fields -->
    <Dialog 
      v-model:visible="itemDialog" 
      :style="{ width: '500px' }" 
      :header="dialogMode === 'create' ? $t('common.create') : $t('common.edit')" 
      :modal="true"
      position="right"
    >
      <div class="flex flex-col gap-4">
        <!-- Dynamic form fields from metadata -->
        <div 
          v-for="field in formFields" 
          :key="field.field_name" 
          class="flex flex-col gap-2"
        >
          <label :for="field.field_name" class="font-semibold">
            {{ $t(field.label_key) }}
            <span v-if="field.is_required" class="text-red-500">*</span>
          </label>
          
          <!-- Text input -->
          <InputText 
            v-if="field.field_type === 'text'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
            :maxlength="field.max_length"
            fluid 
          />
          
          <!-- Textarea -->
          <Textarea 
            v-else-if="field.field_type === 'textarea'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
            rows="3" 
            fluid 
          />
          
          <!-- Number input -->
          <InputNumber 
            v-else-if="field.field_type === 'number'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
            :min="field.min_value"
            :max="field.max_value"
            fluid 
          />
          
          <!-- Select with refresh button -->
          <div v-else-if="field.field_type === 'select'" class="flex gap-2">
            <Select 
              :id="field.field_name" 
              v-model="editItem[field.field_name]" 
              :options="getFieldOptions(field)" 
              optionLabel="label" 
              optionValue="value" 
              :disabled="field.is_readonly"
              :loading="refreshingField === field.field_name"
              class="flex-1"
            >
              <template #value="slotProps">
                <div 
                  v-if="slotProps.value" 
                  class="flex items-center gap-2 px-2 py-1 rounded"
                  :style="getTagStyle(getOptionByValue(field, slotProps.value)?.color)"
                >
                  <i 
                    v-if="getOptionByValue(field, slotProps.value)?.icon" 
                    :class="['pi', getOptionByValue(field, slotProps.value)?.icon]" 
                  />
                  <span>{{ getOptionByValue(field, slotProps.value)?.label }}</span>
                </div>
                <span v-else>{{ slotProps.placeholder }}</span>
              </template>
              <template #option="slotProps">
                <div 
                  class="flex items-center gap-2 px-2 py-1 rounded"
                  :style="getTagStyle(slotProps.option.color)"
                >
                  <i 
                    v-if="slotProps.option.icon" 
                    :class="['pi', slotProps.option.icon]" 
                  />
                  <span>{{ slotProps.option.label }}</span>
                </div>
              </template>
            </Select>
            <Button 
              v-if="isApiOptionsSource(field)"
              icon="pi pi-refresh" 
              severity="secondary" 
              @click="refreshFieldOptions(field)"
              :loading="refreshingField === field.field_name"
              v-tooltip.top="$t('common.refresh')"
            />
          </div>
          
          <!-- Boolean toggle -->
          <ToggleSwitch 
            v-else-if="field.field_type === 'boolean'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
          />
          
          <!-- Date picker -->
          <DatePicker 
            v-else-if="field.field_type === 'date'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
            dateFormat="dd/mm/yy"
            fluid 
          />
          
          <!-- Datetime picker -->
          <DatePicker 
            v-else-if="field.field_type === 'datetime'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
            dateFormat="dd/mm/yy"
            showTime
            fluid 
          />
          
          <!-- Relation (placeholder - will need autocomplete) -->
          <InputText 
            v-else-if="field.field_type === 'relation'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
            :placeholder="`Select ${field.relation_object}...`"
            fluid 
          />
          
          <!-- Tag Style Selector -->
          <TagStyleSelector 
            v-else-if="field.field_type === 'tag_style'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
          />
          
          <!-- Icon Picker -->
          <IconSelector 
            v-else-if="field.field_type === 'icon_picker'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
          />
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
      :header="$t('common.delete')" 
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-3xl text-orange-500" />
        <span v-if="selectedItems?.length === 1">
          {{ $t('common.confirmDelete') }}
        </span>
        <span v-else>
          {{ $t('common.confirmDeleteMultiple', { count: selectedItems?.length }) }}
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
import metadataService from '@/services/metadataService'
import { useTabsStore } from '@/stores/tabsStore'

// PrimeVue components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
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
import ToggleSwitch from 'primevue/toggleswitch'

// Custom form components
import TagStyleSelector from '@/components/form/TagStyleSelector.vue'
import IconSelector from '@/components/form/IconSelector.vue'

// Utils
import { getTagStyle, getColorValue } from '@/utils/tagStyles'

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

// Stores
const tabsStore = useTabsStore()

// Get service for this object type
const service = computed(() => getService(props.objectType))
const serviceAvailable = computed(() => hasService(props.objectType))

// Metadata
const objectTypeMetadata = ref(null)
const tableColumns = ref([])
const formFields = ref([])
const metadataLoading = ref(true)
const fieldOptions = ref({}) // Cache for field options (including API-loaded ones)

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
const refreshingField = ref(null)

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

// Filters - built dynamically from metadata
const initFilters = () => {
  const baseFilters = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  }
  
  // Add filters for each column
  for (const col of tableColumns.value) {
    if (col.is_filterable) {
      const matchMode = getDefaultMatchMode(col)
      baseFilters[col.field_name] = {
        operator: col.field_type === 'select' ? FilterOperator.OR : FilterOperator.AND,
        constraints: [{ value: null, matchMode }]
      }
    }
  }
  
  return baseFilters
}

const getDefaultMatchMode = (col) => {
  switch (col.field_type) {
    case 'select':
      return FilterMatchMode.EQUALS
    case 'date':
    case 'datetime':
      return FilterMatchMode.DATE_IS
    case 'number':
      return FilterMatchMode.EQUALS
    case 'boolean':
      return FilterMatchMode.EQUALS
    default:
      return FilterMatchMode.CONTAINS
  }
}

const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } })

// Context menu
const menuModel = ref([
  { label: t('common.edit'), icon: 'pi pi-pencil', command: () => openEditDialog(selectedItem.value) },
  { label: t('common.delete'), icon: 'pi pi-trash', command: () => confirmDeleteSelected() }
])

// Column toggle - built from metadata
const toggleableColumns = computed(() => {
  return tableColumns.value.map(col => ({
    field: col.field_name,
    header: t(col.label_key)
  }))
})

const selectedColumns = ref([])

const isColumnVisible = (field) => {
  return selectedColumns.value.some(col => col.field === field)
}

const toggleColumnSelector = (event) => {
  columnTogglePopover.value.toggle(event)
}

// Get options for select fields (from cache)
const getFieldOptions = (field) => {
  if (!field.options_source) return []
  return fieldOptions.value[field.field_name] || []
}

// Load options for a field (handles both static JSON and API endpoints)
const loadFieldOptions = async (field, useCache = true) => {
  if (!field.options_source) return
  
  let options = []
  
  if (metadataService.isApiEndpoint(field.options_source)) {
    // Load from API
    console.log(`[ObjectsCrud] Loading options from API: ${field.options_source}, useCache: ${useCache}`)
    options = await metadataService.fetchOptions(field.options_source, useCache)
    console.log(`[ObjectsCrud] Loaded ${options.length} options`)
  } else {
    // Parse static JSON
    options = metadataService.parseOptions(field.options_source)
  }
  
  // Transform options: if label_key exists, translate it to label
  fieldOptions.value[field.field_name] = options.map(opt => {
    if (opt.label_key) {
      return { ...opt, label: t(opt.label_key) }
    }
    return opt
  })
}

// Load all field options for select fields
const loadAllFieldOptions = async (fields) => {
  const selectFields = fields.filter(f => f.field_type === 'select' && f.options_source)
  await Promise.all(selectFields.map(f => loadFieldOptions(f)))
}

// Check if field options come from API (not static JSON)
const isApiOptionsSource = (field) => {
  return field.options_source && metadataService.isApiEndpoint(field.options_source)
}

// Refresh options for a specific field
const refreshFieldOptions = async (field) => {
  if (!field.options_source) return
  
  console.log(`[ObjectsCrud] Refreshing options for field: ${field.field_name}`)
  
  try {
    refreshingField.value = field.field_name
    // Pass useCache = false to force reload from API
    await loadFieldOptions(field, false)
    toast.add({ 
      severity: 'success', 
      summary: 'Success', 
      detail: t('common.optionsRefreshed'), 
      life: 2000 
    })
  } catch (error) {
    console.error('Failed to refresh field options:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to refresh options', 
      life: 3000 
    })
  } finally {
    refreshingField.value = null
  }
}

// Computed
const hasActiveFilters = computed(() => {
  if (filters.value.global?.value) return true
  for (const col of tableColumns.value) {
    const filter = filters.value[col.field_name]
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
  // Initialize with default values from form fields
  const defaults = {}
  for (const field of formFields.value) {
    if (field.field_type === 'boolean') {
      defaults[field.field_name] = false
    } else if (field.field_type === 'select' && field.options_source) {
      const options = getFieldOptions(field)
      defaults[field.field_name] = options.length > 0 ? options[0].value : null
    } else {
      defaults[field.field_name] = null
    }
  }
  editItem.value = defaults
  dialogMode.value = 'create'
  itemDialog.value = true
}

const openEditDialog = (data) => {
  editItem.value = { ...data }
  dialogMode.value = 'edit'
  itemDialog.value = true
}

// Open edit in child tab (for toolbar Edit button)
const openEditInTab = (data) => {
  if (!data) return
  
  // Get the first required field as display name
  const nameField = formFields.value.find(f => f.is_required) || formFields.value[0]
  const displayName = data[nameField?.field_name] || data.uuid?.substring(0, 8)
  
  // Find the parent tab id_tab
  const parentTab = tabsStore.tabs.find(t => t.id === `${props.objectType}s` || t.objectType === props.objectType)
  
  tabsStore.openTab({
    id: `${props.objectType}-edit-${data.uuid}`,
    label: `${displayName}`,
    icon: objectTypeMetadata.value?.icon || 'pi pi-file',
    component: 'ObjectDetail',
    objectType: props.objectType,
    objectId: data.uuid,
    parentId: parentTab?.id_tab || props.tabId,
    mode: 'edit'
  })
}

const saveItem = async () => {
  // Validate required fields
  const requiredFields = formFields.value.filter(f => f.is_required)
  for (const field of requiredFields) {
    const value = editItem.value[field.field_name]
    if (value === null || value === undefined || value === '') {
      toast.add({ severity: 'warn', summary: 'Warning', detail: `${t(field.label_key)} is required`, life: 3000 })
      return
    }
  }

  try {
    saving.value = true
    const labelKey = objectTypeMetadata.value?.label_key?.split('.')[0] || 'common'
    if (dialogMode.value === 'create') {
      await service.value.create(editItem.value)
      toast.add({ severity: 'success', summary: 'Success', detail: t(`${labelKey}.messages.created`), life: 3000 })
    } else {
      await service.value.update(editItem.value.uuid, editItem.value)
      toast.add({ severity: 'success', summary: 'Success', detail: t(`${labelKey}.messages.updated`), life: 3000 })
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
    const labelKey = objectTypeMetadata.value?.label_key?.split('.')[0] || 'common'
    await service.value.deleteMany(uuids)
    toast.add({ 
      severity: 'success', 
      summary: 'Success', 
      detail: t(`${labelKey}.messages.deletedMultiple`, { count: uuids.length }), 
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
    const labelKey = objectTypeMetadata.value?.label_key?.split('.')[0] || 'common'
    await service.value.update(data.uuid, { [field]: newValue })
    data[field] = newValue
    toast.add({ severity: 'success', summary: 'Success', detail: t(`${labelKey}.messages.updated`), life: 3000 })
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

// Format cell value based on field type
const formatCellValue = (value, field) => {
  if (value === null || value === undefined) return '-'
  
  switch (field.field_type) {
    case 'datetime':
    case 'date':
      return formatDate(value)
    case 'boolean':
      return value ? t('common.yes') : t('common.no')
    case 'select':
      const options = getFieldOptions(field)
      const option = options.find(o => o.value === value)
      return option?.label || value
    default:
      return value
  }
}

const onColumnReorder = (event) => {
  console.log('[ObjectsCrud] Column reorder event:', event)
}

const onStateRestore = (event) => {
  console.log('[ObjectsCrud] State restored:', event)
}

// Get option by value for a field
const getOptionByValue = (field, value) => {
  const options = getFieldOptions(field)
  return options.find(o => o.value === value)
}

// Note: getTagStyle and getColorValue are now imported from @/utils/tagStyles

// Load metadata for this object type
const loadMetadata = async () => {
  try {
    metadataLoading.value = true
    
    // Load object type with all fields
    objectTypeMetadata.value = await metadataService.getObjectType(props.objectType)
    
    if (objectTypeMetadata.value) {
      // Separate table columns and form fields
      tableColumns.value = objectTypeMetadata.value.fields.filter(f => f.show_in_table)
      formFields.value = objectTypeMetadata.value.fields.filter(f => f.show_in_form)
      
      // Load options for all select fields (including API endpoints)
      const allFields = objectTypeMetadata.value.fields
      await loadAllFieldOptions(allFields)
      
      // Set default sort from metadata
      sortField.value = objectTypeMetadata.value.default_sort_field || 'updated_at'
      sortOrder.value = objectTypeMetadata.value.default_sort_order || -1
      
      // Initialize filters based on columns
      filters.value = initFilters()
      
      // Initialize selected columns (visible by default)
      selectedColumns.value = tableColumns.value
        .filter(col => col.default_visible)
        .map(col => ({ field: col.field_name, header: t(col.label_key) }))
    }
  } catch (error) {
    console.error('Failed to load metadata:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load metadata', life: 3000 })
  } finally {
    metadataLoading.value = false
  }
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
onMounted(async () => {
  await loadMetadata()
  if (serviceAvailable.value) {
    await loadItems(1)
  }
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
