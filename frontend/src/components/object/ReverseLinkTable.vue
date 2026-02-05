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
        @click="openCreateDialog"
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
              @click="openEditDialog(data)"
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

    <!-- Create/Edit Dialog -->
    <Dialog 
      v-model:visible="dialogVisible" 
      :header="isEditing ? t('serviceOfferings.editOffering') : t('serviceOfferings.addNew')"
      :style="{ width: '600px' }"
      modal
    >
      <div class="flex flex-col gap-4 pt-4">
        <!-- Name -->
        <div class="flex flex-col gap-2">
          <label class="font-medium">{{ t('serviceOfferings.name') }} *</label>
          <InputText v-model="editItem.name" class="w-full" />
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-2">
          <label class="font-medium">{{ t('serviceOfferings.description') }}</label>
          <Textarea v-model="editItem.description" rows="3" class="w-full" />
        </div>

        <!-- Environment -->
        <div class="flex flex-col gap-2">
          <label class="font-medium">{{ t('serviceOfferings.environment') }}</label>
          <Select 
            v-model="editItem.environment" 
            :options="environmentOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select environment"
            class="w-full"
          />
        </div>

        <!-- Operator Entity -->
        <div class="flex flex-col gap-2">
          <label class="font-medium">{{ t('serviceOfferings.operatorEntity') }} *</label>
          <Select 
            v-model="editItem.operator_entity_uuid" 
            :options="entities"
            optionLabel="name"
            optionValue="uuid"
            filter
            placeholder="Select operator entity"
            class="w-full"
          />
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-medium">{{ t('serviceOfferings.startDate') }}</label>
            <DatePicker v-model="editItem.start_date" dateFormat="yy-mm-dd" class="w-full" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-medium">{{ t('serviceOfferings.endDate') }}</label>
            <DatePicker v-model="editItem.end_date" dateFormat="yy-mm-dd" class="w-full" />
          </div>
        </div>

        <!-- Business Criticality -->
        <div class="flex flex-col gap-2">
          <label class="font-medium">{{ t('serviceOfferings.businessCriticality') }}</label>
          <Select 
            v-model="editItem.business_criticality" 
            :options="criticalityOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select criticality"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button 
            :label="t('common.cancel')" 
            severity="secondary" 
            @click="dialogVisible = false" 
          />
          <Button 
            :label="t('common.save')" 
            :loading="saving"
            @click="saveItem" 
          />
        </div>
      </template>
    </Dialog>

    <!-- Delete confirmation -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'
import serviceOfferingsService from '@/services/serviceOfferingsService'
import entitiesService from '@/services/entitiesService'
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
const confirm = useConfirm()

// State
const loading = ref(false)
const saving = ref(false)
const items = ref([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const editItem = ref({})

// Reference data
const entities = ref([])
const environmentOptions = ref([])
const criticalityOptions = ref([])

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

// Load reference data
const loadReferenceData = async () => {
  try {
    // Load entities
    const entitiesResult = await entitiesService.getAll({ limit: 1000 })
    entities.value = entitiesResult.data || []

    // Load environment options
    const envResponse = await api.get('/object-setup/options', { 
      params: { object_type: 'service_offering', metadata: 'ENVIRONMENT' } 
    })
    environmentOptions.value = envResponse.data || []

    // Load criticality options
    const critResponse = await api.get('/object-setup/options', { 
      params: { object_type: 'service', metadata: 'BUSINESS_CRITICALITY' } 
    })
    criticalityOptions.value = critResponse.data || []
  } catch (error) {
    console.error('Error loading reference data:', error)
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

// Dialog actions
const openCreateDialog = () => {
  isEditing.value = false
  editItem.value = {
    name: '',
    description: '',
    environment: null,
    business_criticality: null,
    start_date: new Date(),
    end_date: null,
    operator_entity_uuid: null,
    service_uuid: props.parentUuid
  }
  dialogVisible.value = true
}

const openEditDialog = (item) => {
  isEditing.value = true
  editItem.value = {
    ...item,
    start_date: item.start_date ? new Date(item.start_date) : null,
    end_date: item.end_date ? new Date(item.end_date) : null
  }
  dialogVisible.value = true
}

// Save item
const saveItem = async () => {
  if (!editItem.value.name || !editItem.value.operator_entity_uuid) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill required fields', life: 3000 })
    return
  }

  saving.value = true
  try {
    const data = {
      name: editItem.value.name,
      description: editItem.value.description,
      environment: editItem.value.environment,
      business_criticality: editItem.value.business_criticality,
      start_date: editItem.value.start_date ? editItem.value.start_date.toISOString().split('T')[0] : null,
      end_date: editItem.value.end_date ? editItem.value.end_date.toISOString().split('T')[0] : null,
      operator_entity_uuid: editItem.value.operator_entity_uuid,
      service_uuid: props.parentUuid
    }

    if (isEditing.value) {
      await serviceOfferingsService.update(editItem.value.uuid, data)
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('serviceOfferings.messages.updated'), life: 3000 })
    } else {
      await serviceOfferingsService.create(data)
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('serviceOfferings.messages.created'), life: 3000 })
    }

    dialogVisible.value = false
    await loadItems()
  } catch (error) {
    console.error('Error saving service offering:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save service offering', life: 3000 })
  } finally {
    saving.value = false
  }
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

onMounted(() => {
  loadReferenceData()
})
</script>

<style scoped>
.reverse-link-table {
  padding: 1rem;
}
</style>
