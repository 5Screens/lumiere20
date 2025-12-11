<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
      <!-- Toolbar -->
      <Toolbar class="mb-4">
        <template #start>
          <span class="text-xl font-semibold">{{ $t('audit.title') }}</span>
        </template>

        <template #end>
          <Button 
            :label="$t('common.refresh')" 
            icon="pi pi-refresh" 
            severity="secondary" 
            @click="loadData" 
          />
        </template>
      </Toolbar>

      <!-- DataTable -->
      <DataTable
        ref="dt"
        v-model:filters="filters"
        v-model:sortField="sortField"
        v-model:sortOrder="sortOrder"
        :value="items"
        :loading="loading"
        :paginator="true"
        :rows="rows"
        :rowsPerPageOptions="[10, 25, 50, 100]"
        :totalRecords="totalRecords"
        :lazy="true"
        @page="onPage"
        @sort="onSort"
        @filter="onFilter"
        dataKey="uuid"
        filterDisplay="menu"
        :globalFilterFields="['object_type', 'event_type', 'attribute_name']"
        scrollable
        scrollHeight="flex"
        class="flex-1"
        :pt="{
          root: { class: 'flex flex-col h-full' },
          tableContainer: { class: 'flex-1 overflow-auto' }
        }"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText 
                v-model="filters['global'].value" 
                :placeholder="$t('common.search')" 
                @input="onGlobalFilter"
              />
            </IconField>
          </div>
        </template>

        <template #empty>
          <div class="text-center py-8 text-surface-500">
            {{ $t('common.noData') }}
          </div>
        </template>

        <!-- Event Date -->
        <Column 
          field="event_date" 
          :header="$t('audit.eventDate')" 
          :sortable="true"
          style="min-width: 180px"
        >
          <template #body="{ data }">
            {{ formatDateTime(data.event_date) }}
          </template>
        </Column>

        <!-- Event Type -->
        <Column 
          field="event_type" 
          :header="$t('audit.eventType')" 
          :sortable="true"
          :showFilterMatchModes="false"
          style="min-width: 180px"
        >
          <template #body="{ data }">
            <Tag :value="getEventTypeLabel(data.event_type)" :severity="getEventTypeSeverity(data.event_type)" />
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <Select 
              v-model="filterModel.value" 
              :options="eventTypeOptions" 
              optionLabel="label" 
              optionValue="value"
              :placeholder="$t('common.select')"
              class="w-full"
              :showClear="true"
              @change="filterCallback()"
            >
              <template #option="{ option }">
                <Tag :value="getEventTypeLabel(option.value)" :severity="getEventTypeSeverity(option.value)" />
              </template>
            </Select>
          </template>
        </Column>

        <!-- Object Type -->
        <Column 
          field="object_type" 
          :header="$t('audit.objectType')" 
          :sortable="true"
          style="min-width: 120px"
        >
          <template #body="{ data }">
            <span class="capitalize">{{ data.object_type }}</span>
          </template>
        </Column>

        <!-- User -->
        <Column 
          field="user" 
          :header="$t('audit.user')" 
          style="min-width: 200px"
        >
          <template #body="{ data }">
            <span v-if="data.user">
              {{ data.user.first_name }} {{ data.user.last_name }}
            </span>
            <span v-else class="text-surface-400">-</span>
          </template>
        </Column>

        <!-- Attribute Name -->
        <Column 
          field="attribute_name" 
          :header="$t('audit.attributeName')" 
          :sortable="true"
          style="min-width: 150px"
        >
          <template #body="{ data }">
            <span v-if="data.attribute_name">{{ data.attribute_name }}</span>
            <span v-else class="text-surface-400">-</span>
          </template>
        </Column>

        <!-- Old Value -->
        <Column 
          field="old_value" 
          :header="$t('audit.oldValue')" 
          style="min-width: 150px"
        >
          <template #body="{ data }">
            <span v-if="data.old_value" class="text-red-500 line-through">{{ truncateValue(data.old_value) }}</span>
            <span v-else class="text-surface-400">-</span>
          </template>
        </Column>

        <!-- New Value -->
        <Column 
          field="new_value" 
          :header="$t('audit.newValue')" 
          style="min-width: 150px"
        >
          <template #body="{ data }">
            <span v-if="data.new_value" class="text-green-500">{{ truncateValue(data.new_value) }}</span>
            <span v-else class="text-surface-400">-</span>
          </template>
        </Column>

        <!-- Object UUID -->
        <Column 
          field="object_uuid" 
          :header="$t('audit.objectUuid')" 
          style="min-width: 300px"
        >
          <template #body="{ data }">
            <code class="text-xs bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">{{ data.object_uuid }}</code>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Tag from 'primevue/tag'
import Select from 'primevue/select'
import auditService from '@/services/auditService'

const { t, locale } = useI18n()
const toast = useToast()

// State
const items = ref([])
const loading = ref(false)
const totalRecords = ref(0)
const rows = ref(25)
const first = ref(0)
const sortField = ref('event_date')
const sortOrder = ref(-1)
const dt = ref()

// Event type options for filter dropdown
const eventTypeOptions = [
  { value: 'Password_RESET', label: 'Password_RESET' },
  { value: 'Obj_CREATED', label: 'Obj_CREATED' },
  { value: 'Field_UPDATED', label: 'Field_UPDATED' },
  { value: 'Obj_DELETED', label: 'Obj_DELETED' }
]

// Filters
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  event_type: { value: null, matchMode: FilterMatchMode.EQUALS }
})

// Load data
const loadData = async () => {
  loading.value = true
  try {
    const result = await auditService.search({
      filters: filters.value,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      page: Math.floor(first.value / rows.value) + 1,
      limit: rows.value
    })
    items.value = result.data
    totalRecords.value = result.total
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.message,
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Event handlers
const onPage = (event) => {
  first.value = event.first
  rows.value = event.rows
  loadData()
}

const onSort = (event) => {
  sortField.value = event.sortField
  sortOrder.value = event.sortOrder
  loadData()
}

const onFilter = () => {
  first.value = 0
  loadData()
}

let globalFilterTimeout = null
const onGlobalFilter = () => {
  clearTimeout(globalFilterTimeout)
  globalFilterTimeout = setTimeout(() => {
    first.value = 0
    loadData()
  }, 300)
}

// Format date/time
const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Get event type label
const getEventTypeLabel = (eventType) => {
  const key = `audit.eventTypes.${eventType}`
  const translated = t(key)
  return translated !== key ? translated : eventType
}

// Get event type severity for Tag
const getEventTypeSeverity = (eventType) => {
  const severities = {
    'Password_RESET': 'warn',
    'Obj_CREATED': 'success',
    'Field_UPDATED': 'info',
    'Obj_DELETED': 'danger'
  }
  return severities[eventType] || 'secondary'
}

// Truncate long values
const truncateValue = (value, maxLength = 50) => {
  if (!value) return '-'
  if (value.length <= maxLength) return value
  return value.substring(0, maxLength) + '...'
}

// Initialize
onMounted(() => {
  loadData()
})
</script>
