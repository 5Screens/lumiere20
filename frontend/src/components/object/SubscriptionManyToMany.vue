<template>
  <div class="subscription-mn p-4 flex flex-col h-full">
    <!-- Header with title and counter -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-200">
        {{ t(field.label_key) }}
      </h3>
      <span class="text-sm text-surface-500 dark:text-surface-400">
        {{ t('common.mnSelectedCount', { selected: selectedUuids.size, total: allItems.length }) }}
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
        @click="selectAll"
      />
      <Button 
        :label="t('common.mnDeselectAll')" 
        size="small" 
        severity="secondary" 
        outlined
        @click="deselectAll"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- Items list with checkboxes and editable subscription fields -->
    <div v-else class="overflow-hidden flex-1 min-h-0 flex flex-col">
      <DataTable 
        :value="filteredItems" 
        :scrollable="true"
        scrollHeight="flex"
        stripedRows
        rowHover
        size="small"
        class="p-datatable-sm flex-1"
        :pt="{ bodyRow: { class: 'cursor-pointer' } }"
        @row-click="onRowClick($event.data)"
      >
        <!-- Checkbox column -->
        <Column header="" style="width: 50px">
          <template #body="{ data }">
            <Checkbox 
              :modelValue="selectedUuids.has(data.uuid)"
              :binary="true"
              @click.stop="toggleItem(data)"
            />
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

        <!-- Subscription: Start Date (editable) -->
        <Column :header="t('subscriptions.startDate')" style="min-width: 160px">
          <template #body="{ data }">
            <DatePicker
              v-if="selectedUuids.has(data.uuid)"
              :modelValue="getSubscriptionField(data.uuid, 'start_date')"
              @update:modelValue="setSubscriptionField(data.uuid, 'start_date', $event)"
              dateFormat="yy-mm-dd"
              size="small"
              showIcon
              class="w-full"
              @click.stop
            />
            <span v-else class="text-surface-400">-</span>
          </template>
        </Column>

        <!-- Subscription: End Date (editable) -->
        <Column :header="t('subscriptions.endDate')" style="min-width: 160px">
          <template #body="{ data }">
            <DatePicker
              v-if="selectedUuids.has(data.uuid)"
              :modelValue="getSubscriptionField(data.uuid, 'end_date')"
              @update:modelValue="setSubscriptionField(data.uuid, 'end_date', $event)"
              dateFormat="yy-mm-dd"
              size="small"
              showIcon
              showButtonBar
              class="w-full"
              @click.stop
            />
            <span v-else class="text-surface-400">-</span>
          </template>
        </Column>

        <!-- Subscription: Is Active (editable) -->
        <Column :header="t('common.isActive')" style="min-width: 80px; text-align: center">
          <template #body="{ data }">
            <ToggleSwitch
              v-if="selectedUuids.has(data.uuid)"
              :modelValue="getSubscriptionField(data.uuid, 'is_active')"
              @update:modelValue="setSubscriptionField(data.uuid, 'is_active', $event)"
              @click.stop
            />
            <span v-else class="text-surface-400">-</span>
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
import { ref, computed, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import SelectButton from 'primevue/selectbutton'
import ProgressSpinner from 'primevue/progressspinner'
import DatePicker from 'primevue/datepicker'
import ToggleSwitch from 'primevue/toggleswitch'
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
  }
})

const { t, locale } = useI18n()
const toast = useToast()

// State
const loading = ref(false)
const saving = ref(false)
const allItems = ref([])
const selectedUuids = ref(new Set())
const originalUuids = ref(new Set())
const searchQuery = ref('')
const filterMode = ref(null)

// Subscription metadata per subscriber uuid: { start_date, end_date, is_active }
const subscriptionData = reactive({})
const originalSubscriptionData = reactive({})

// Filter options
const filterOptions = computed(() => [
  { label: t('common.mnFilterSelected'), value: 'selected' },
  { label: t('common.mnFilterNotSelected'), value: 'not_selected' }
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

// subscriber_type is stored in relation_filter for this field_type
const subscriberType = computed(() => props.field.relation_filter)

// Filtered items based on search and filter mode
const filteredItems = computed(() => {
  let result = allItems.value

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => {
      const primary = item[primaryField.value]
      if (primary && String(primary).toLowerCase().includes(query)) return true
      const displayFields = props.field.relation_display?.split(',') || []
      return displayFields.some(f => {
        const val = item[f.trim()]
        return val && String(val).toLowerCase().includes(query)
      })
    })
  }

  // Apply selection filter
  if (filterMode.value === 'selected') {
    result = result.filter(item => selectedUuids.value.has(item.uuid))
  } else if (filterMode.value === 'not_selected') {
    result = result.filter(item => !selectedUuids.value.has(item.uuid))
  }

  return result
})

// Check if there are unsaved changes (selection or subscription data)
const hasChanges = computed(() => {
  // Check selection changes
  if (selectedUuids.value.size !== originalUuids.value.size) return true
  for (const uuid of selectedUuids.value) {
    if (!originalUuids.value.has(uuid)) return true
  }
  for (const uuid of originalUuids.value) {
    if (!selectedUuids.value.has(uuid)) return true
  }

  // Check subscription data changes
  for (const uuid of selectedUuids.value) {
    const current = subscriptionData[uuid]
    const original = originalSubscriptionData[uuid]
    if (!current || !original) continue

    if (formatDateISO(current.start_date) !== formatDateISO(original.start_date)) return true
    if (formatDateISO(current.end_date) !== formatDateISO(original.end_date)) return true
    if (current.is_active !== original.is_active) return true
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

// Get subscription field value for a subscriber
const getSubscriptionField = (uuid, fieldName) => {
  const data = subscriptionData[uuid]
  if (!data) return fieldName === 'is_active' ? true : null
  return data[fieldName]
}

// Set subscription field value for a subscriber
const setSubscriptionField = (uuid, fieldName, value) => {
  if (!subscriptionData[uuid]) {
    subscriptionData[uuid] = { start_date: new Date(), end_date: null, is_active: true }
  }
  subscriptionData[uuid][fieldName] = value
}

// Load all items and currently linked subscriptions
const loadData = async () => {
  if (!props.parentUuid) return

  loading.value = true
  try {
    const endpoint = getApiEndpoint()

    // Load ALL items of the related object type
    const allResponse = await api.post(`${endpoint}/search`, {
      filters: {},
      first: 0,
      rows: 10000,
      sortField: primaryField.value,
      sortOrder: 1
    })
    allItems.value = allResponse.data?.data || allResponse.data || []

    // Load current subscriptions for this service offering + subscriber_type
    const subsResponse = await api.get(`/service-offerings/${props.parentUuid}/subscriptions`, {
      params: { subscriber_type: subscriberType.value }
    })
    const subscriptions = subsResponse.data || []

    // Map subscriber_type to FK field name
    const fkFieldMap = {
      entity: 'rel_entity_uuid',
      location: 'rel_location_uuid',
      group: 'rel_group_uuid',
      user_set: 'rel_user_set_uuid',
    }
    const fkField = fkFieldMap[subscriberType.value]

    // Build selected set and subscription data
    const linkedSet = new Set()
    for (const sub of subscriptions) {
      const subscriberUuid = sub[fkField]
      if (subscriberUuid) {
        linkedSet.add(subscriberUuid)
        const subData = {
          start_date: sub.start_date ? new Date(sub.start_date) : new Date(),
          end_date: sub.end_date ? new Date(sub.end_date) : null,
          is_active: sub.is_active !== undefined ? sub.is_active : true,
        }
        subscriptionData[subscriberUuid] = { ...subData }
        originalSubscriptionData[subscriberUuid] = { ...subData }
      }
    }

    selectedUuids.value = new Set(linkedSet)
    originalUuids.value = new Set(linkedSet)
  } catch (error) {
    console.error(`Error loading subscriptions for ${props.field.relation_object}:`, error)
    toast.add({ severity: 'error', summary: 'Error', detail: `Failed to load ${props.field.relation_object}`, life: 3000 })
  } finally {
    loading.value = false
  }
}

// Toggle item selection
const toggleItem = (item) => {
  const newSet = new Set(selectedUuids.value)
  if (newSet.has(item.uuid)) {
    newSet.delete(item.uuid)
  } else {
    newSet.add(item.uuid)
    // Initialize subscription data with defaults if not existing
    if (!subscriptionData[item.uuid]) {
      subscriptionData[item.uuid] = { start_date: new Date(), end_date: null, is_active: true }
    }
  }
  selectedUuids.value = newSet
}

// Row click toggles selection (same as checkbox)
const onRowClick = (item) => {
  toggleItem(item)
}

// Select all visible items
const selectAll = () => {
  const newSet = new Set(selectedUuids.value)
  filteredItems.value.forEach(item => {
    newSet.add(item.uuid)
    if (!subscriptionData[item.uuid]) {
      subscriptionData[item.uuid] = { start_date: new Date(), end_date: null, is_active: true }
    }
  })
  selectedUuids.value = newSet
}

// Deselect all visible items
const deselectAll = () => {
  const newSet = new Set(selectedUuids.value)
  filteredItems.value.forEach(item => newSet.delete(item.uuid))
  selectedUuids.value = newSet
}

// Revert to original state
const revert = () => {
  selectedUuids.value = new Set(originalUuids.value)
  // Restore subscription data
  for (const uuid of Object.keys(subscriptionData)) {
    delete subscriptionData[uuid]
  }
  for (const [uuid, data] of Object.entries(originalSubscriptionData)) {
    subscriptionData[uuid] = { ...data }
  }
}

// Confirm changes: compute diff and call sync API
const confirmChanges = async () => {
  saving.value = true
  try {
    const syncUrl = getSyncUrl()

    // Compute added and removed
    const toAdd = []
    const toRemove = []
    const toUpdate = []

    for (const uuid of selectedUuids.value) {
      if (!originalUuids.value.has(uuid)) {
        toAdd.push(uuid)
      }
    }
    for (const uuid of originalUuids.value) {
      if (!selectedUuids.value.has(uuid)) {
        toRemove.push(uuid)
      }
    }

    // Collect updates for existing subscriptions that changed
    for (const uuid of selectedUuids.value) {
      if (originalUuids.value.has(uuid)) {
        const current = subscriptionData[uuid]
        const original = originalSubscriptionData[uuid]
        if (!current || !original) continue

        const changes = {}
        if (formatDateISO(current.start_date) !== formatDateISO(original.start_date)) {
          changes.start_date = formatDateISO(current.start_date)
        }
        if (formatDateISO(current.end_date) !== formatDateISO(original.end_date)) {
          changes.end_date = formatDateISO(current.end_date)
        }
        if (current.is_active !== original.is_active) {
          changes.is_active = current.is_active
        }

        if (Object.keys(changes).length > 0) {
          toUpdate.push({ uuid, ...changes })
        }
      }
    }

    // Call sync API
    if (toAdd.length > 0 || toRemove.length > 0 || toUpdate.length > 0) {
      await api.post(syncUrl, {
        subscriber_type: subscriberType.value,
        add: toAdd,
        remove: toRemove,
        update: toUpdate
      })
    }

    // Update original state
    originalUuids.value = new Set(selectedUuids.value)
    for (const uuid of selectedUuids.value) {
      if (subscriptionData[uuid]) {
        originalSubscriptionData[uuid] = { ...subscriptionData[uuid] }
      }
    }

    toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.mnSaved'), life: 3000 })
  } catch (error) {
    console.error(`Error saving subscriptions for ${props.field.relation_object}:`, error)
    toast.add({ severity: 'error', summary: 'Error', detail: t('common.mnSaveFailed'), life: 3000 })
  } finally {
    saving.value = false
  }
}

// Format date to ISO string (YYYY-MM-DD) or null
const formatDateISO = (date) => {
  if (!date) return null
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}

// Format date for display
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value)
}

// Watch for parent changes
watch(() => props.parentUuid, () => {
  loadData()
}, { immediate: true })
</script>
