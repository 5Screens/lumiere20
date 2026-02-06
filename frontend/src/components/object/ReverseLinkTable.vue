<template>
  <div class="reverse-link-table">
    <!-- Header with title and add button -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-200">
        {{ t(field.label_key) }}
      </h3>
      <Button 
        :label="t('common.add')" 
        icon="pi pi-plus" 
        size="small"
        @click="openCreateDrawer"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- Empty state -->
    <div v-else-if="items.length === 0" class="text-center py-8">
      <i class="pi pi-inbox text-4xl text-surface-400 mb-4" />
      <p class="text-surface-500 dark:text-surface-400">{{ t('common.noData') }}</p>
    </div>

    <!-- Data table -->
    <DataTable 
      v-else
      :value="items" 
      :loading="loading"
      stripedRows
      size="small"
      class="p-datatable-sm"
    >
      <!-- Dynamic columns based on relation_display -->
      <Column 
        v-for="col in displayColumns" 
        :key="col.field"
        :field="col.field" 
        :header="col.header"
        :style="{ minWidth: col.minWidth }"
      >
        <template #body="{ data }">
          <!-- Status column -->
          <Tag 
            v-if="col.field === 'status' && data.status"
            :value="getStatusLabel(data.status)"
            :style="getStatusStyle(data.status)"
            class="text-xs"
          />
          <!-- Date columns -->
          <span v-else-if="col.type === 'date'">
            {{ formatDate(data[col.field]) }}
          </span>
          <!-- Default text -->
          <span v-else>{{ data[col.field] || '-' }}</span>
        </template>
      </Column>

      <!-- Actions column -->
      <Column header="" style="width: 100px" frozen alignFrozen="right">
        <template #body="{ data }">
          <div class="flex gap-1 justify-end">
            <Button 
              icon="pi pi-pencil" 
              text 
              rounded 
              size="small"
              severity="secondary"
              @click="openEditDrawer(data)"
            />
            <Button 
              icon="pi pi-trash" 
              text 
              rounded 
              size="small"
              severity="danger"
              @click="confirmDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Create/Edit Drawer with ObjectView -->
    <Drawer 
      v-model:visible="drawerVisible" 
      position="right"
      class="w-full md:w-[600px]"
      :showCloseIcon="false"
      :showHeader="false"
      :dismissable="!objectViewHasUnsavedChanges"
      @hide="onDrawerHide"
    >
      <ObjectView
        ref="objectViewRef"
        :object-type="field.relation_object"
        :object-id="editItemId"
        :mode="drawerMode"
        :defaultValues="defaultValues"
        @saved="onDrawerSaved"
        @close="onDrawerClose"
      />
    </Drawer>

    <!-- Delete confirmation -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'
import ObjectView from './ObjectView.vue'
import api from '@/services/api'
import { getService } from '@/services'

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
const confirm = useConfirm()

// State
const loading = ref(false)
const items = ref([])

// Drawer state
const drawerVisible = ref(false)
const drawerMode = ref('create')
const editItemId = ref(null)
const objectViewRef = ref(null)

// Default values for new items (pre-fill the foreign key based on relation_filter)
const defaultValues = computed(() => {
  const filterField = props.field.relation_filter
  if (filterField) {
    return { [filterField]: props.parentUuid }
  }
  return {}
})

// Get the object type label key prefix (e.g., 'serviceOfferings', 'symptoms', 'causes')
const objectLabelPrefix = computed(() => {
  const objectType = props.field.relation_object
  // Convert snake_case to camelCase for i18n keys
  return objectType.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
})

// Parse display columns from relation_display
const displayColumns = computed(() => {
  const displayFields = props.field.relation_display?.split(',') || ['name']
  return displayFields.map(field => {
    const fieldName = field.trim()
    const isDate = ['start_date', 'end_date', 'created_at', 'updated_at'].includes(fieldName)
    // Try object-specific key first, then common key, then fallback to field name
    const camelFieldName = fieldName.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    return {
      field: fieldName,
      header: t(`${objectLabelPrefix.value}.${camelFieldName}`),
      type: isDate ? 'date' : 'text',
      minWidth: isDate ? '120px' : '150px'
    }
  })
})

// Get the API endpoint for the relation object
const getApiEndpoint = () => {
  const objectType = props.field.relation_object
  // Convert object type to API endpoint (e.g., 'service_offerings' -> '/service-offerings')
  return '/' + objectType.replace(/_/g, '-')
}

// Load items using the filter field
const loadItems = async () => {
  if (!props.parentUuid) return
  
  loading.value = true
  try {
    const endpoint = getApiEndpoint()
    const filterField = props.field.relation_filter
    
    // Use search endpoint with filter
    const response = await api.post(`${endpoint}/search`, {
      filters: {
        [filterField]: { value: props.parentUuid, matchMode: 'equals' }
      },
      first: 0,
      rows: 1000,
      sortField: 'created_at',
      sortOrder: -1
    })
    
    items.value = response.data?.data || response.data || []
  } catch (error) {
    console.error(`Error loading ${props.field.relation_object}:`, error)
    toast.add({ severity: 'error', summary: 'Error', detail: `Failed to load ${props.field.relation_object}`, life: 3000 })
  } finally {
    loading.value = false
  }
}

// Format date
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value)
}

// Status helpers
const getStatusLabel = (status) => {
  if (!status) return ''
  if (status._translations?.name?.[locale.value]) {
    return status._translations.name[locale.value]
  }
  return status.name || ''
}

const getStatusStyle = (status) => {
  if (!status?.category?.color) {
    return { backgroundColor: '#6b7280', color: 'white' }
  }
  return { backgroundColor: status.category.color, color: 'white' }
}

// Computed: check if ObjectView has unsaved changes
const objectViewHasUnsavedChanges = computed(() => {
  if (!objectViewRef.value) return false
  return objectViewRef.value.hasUnsavedChanges?.()
})

// Drawer actions
const openCreateDrawer = () => {
  editItemId.value = null
  drawerMode.value = 'create'
  drawerVisible.value = true
}

const openEditDrawer = (item) => {
  editItemId.value = item.uuid
  drawerMode.value = 'edit'
  drawerVisible.value = true
}

// Drawer event handlers
const onDrawerHide = () => {
  objectViewRef.value = null
}

const onDrawerClose = () => {
  drawerVisible.value = false
}

const onDrawerSaved = async () => {
  drawerVisible.value = false
  await loadItems()
}

// Delete item
const confirmDelete = (item) => {
  const displayName = item.name || item.label || item.code || item.uuid
  confirm.require({
    message: t('common.confirmDeleteMessage', { name: displayName }),
    header: t('common.confirmDelete'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        const endpoint = getApiEndpoint()
        await api.delete(`${endpoint}/${item.uuid}`)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.deleted'), life: 3000 })
        await loadItems()
      } catch (error) {
        console.error(`Error deleting ${props.field.relation_object}:`, error)
        toast.add({ severity: 'error', summary: 'Error', detail: t('common.deleteFailed'), life: 3000 })
      }
    }
  })
}

// Watch for parent changes
watch(() => props.parentUuid, () => {
  loadItems()
}, { immediate: true })
</script>

<style scoped>
.reverse-link-table {
  padding: 1rem;
}
</style>
