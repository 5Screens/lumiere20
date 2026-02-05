<template>
  <div class="reverse-link-table">
    <!-- Header with title and add button -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-200">
        {{ t(field.label_key) }}
      </h3>
      <Button 
        :label="t('serviceOfferings.addNew')" 
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
      <p class="text-surface-500 dark:text-surface-400">{{ t('serviceOfferings.noOfferings') }}</p>
      <p class="text-sm text-surface-400 dark:text-surface-500 mt-2">{{ t('serviceOfferings.noOfferingsDescription') }}</p>
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
import serviceOfferingsService from '@/services/serviceOfferingsService'

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

// Default values for new items (pre-fill service_uuid)
const defaultValues = computed(() => ({
  service_uuid: props.parentUuid
}))

// Parse display columns from relation_display
const displayColumns = computed(() => {
  const displayFields = props.field.relation_display?.split(',') || ['name']
  return displayFields.map(field => {
    const fieldName = field.trim()
    const isDate = ['start_date', 'end_date', 'created_at', 'updated_at'].includes(fieldName)
    return {
      field: fieldName,
      header: t(`serviceOfferings.${fieldName.replace(/_([a-z])/g, (_, c) => c.toUpperCase())}`) || fieldName,
      type: isDate ? 'date' : 'text',
      minWidth: isDate ? '120px' : '150px'
    }
  })
})

// Load items
const loadItems = async () => {
  if (!props.parentUuid) return
  
  loading.value = true
  try {
    items.value = await serviceOfferingsService.getByServiceUuid(props.parentUuid)
  } catch (error) {
    console.error('Error loading service offerings:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load service offerings', life: 3000 })
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
  confirm.require({
    message: `Are you sure you want to delete "${item.name}"?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await serviceOfferingsService.delete(item.uuid)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('serviceOfferings.messages.deleted'), life: 3000 })
        await loadItems()
      } catch (error) {
        console.error('Error deleting service offering:', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete service offering', life: 3000 })
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
