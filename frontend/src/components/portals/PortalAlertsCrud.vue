<template>
  <div class="h-full flex flex-col p-4 gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between shrink-0">
      <div>
        <h2 class="text-xl font-semibold text-surface-800 dark:text-surface-100">
          {{ t('portals.alerts.title') }}
        </h2>
        <p class="text-sm text-surface-500">{{ t('portals.alerts.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <Button 
          icon="pi pi-refresh" 
          severity="secondary" 
          text 
          rounded
          @click="loadAlerts"
          :loading="loading"
          v-tooltip.bottom="t('common.refresh')"
        />
        <Button 
          :label="t('portals.alerts.add')" 
          icon="pi pi-plus" 
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <ProgressSpinner style="width: 50px; height: 50px" />
    </div>

    <!-- Empty state -->
    <div v-else-if="alerts.length === 0" class="flex-1 flex flex-col items-center justify-center text-surface-500">
      <i class="pi pi-bell text-5xl mb-4 opacity-50"></i>
      <p class="text-lg font-medium">{{ t('portals.alerts.empty') }}</p>
      <p class="text-sm">{{ t('portals.alerts.emptyHint') }}</p>
    </div>

    <!-- Table -->
    <DataTable 
      v-else
      :value="alerts" 
      dataKey="uuid"
      :paginator="alerts.length > 10"
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
      size="small"
      stripedRows
      scrollable
      scrollHeight="flex"
      class="flex-1"
    >
      <Column field="code" :header="t('portals.alerts.code')" sortable style="min-width: 120px">
        <template #body="{ data }">
          <code class="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">{{ data.code }}</code>
        </template>
      </Column>
      <Column field="message" :header="t('portals.alerts.message')" sortable style="min-width: 250px">
        <template #body="{ data }">
          <span class="line-clamp-2">{{ data.message }}</span>
        </template>
      </Column>
      <Column field="severity" :header="t('portals.alerts.severity')" sortable style="width: 120px">
        <template #body="{ data }">
          <Tag 
            :value="data.severity || '-'" 
            :severity="getSeverityColor(data.severity)" 
          />
        </template>
      </Column>
      <Column field="icon" :header="t('portals.alerts.icon')" style="width: 80px">
        <template #body="{ data }">
          <i v-if="data.icon" :class="data.icon" class="text-lg text-primary"></i>
          <span v-else class="text-surface-300">-</span>
        </template>
      </Column>
      <Column field="is_active" :header="t('common.status')" sortable style="width: 100px">
        <template #body="{ data }">
          <Tag 
            :value="data.is_active ? t('common.active') : t('common.inactive')" 
            :severity="data.is_active ? 'success' : 'secondary'" 
          />
        </template>
      </Column>
      <Column :header="t('common.actions')" style="width: 100px">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button 
              icon="pi pi-pencil" 
              severity="secondary" 
              text 
              rounded 
              size="small"
              @click="openEditDialog(data)"
              v-tooltip.top="t('common.edit')"
            />
            <Button 
              icon="pi pi-trash" 
              severity="danger" 
              text 
              rounded 
              size="small"
              @click="confirmDelete(data)"
              v-tooltip.top="t('common.delete')"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Create/Edit Dialog -->
    <Dialog 
      v-model:visible="dialogVisible" 
      :header="dialogMode === 'create' ? t('portals.alerts.add') : t('portals.alerts.edit')"
      :style="{ width: '500px' }"
      :modal="true"
      :closable="!saving"
    >
      <div class="flex flex-col gap-4">
        <!-- Code -->
        <div class="flex flex-col gap-2">
          <label for="code" class="font-semibold text-sm">
            {{ t('portals.alerts.code') }} <span class="text-red-500">*</span>
          </label>
          <InputText 
            id="code" 
            v-model="formData.code" 
            :placeholder="t('portals.alerts.codePlaceholder')"
            :invalid="!!errors.code"
            :disabled="dialogMode === 'edit'"
          />
          <small v-if="errors.code" class="text-red-500">{{ errors.code }}</small>
        </div>

        <!-- Message -->
        <div class="flex flex-col gap-2">
          <label for="message" class="font-semibold text-sm">
            {{ t('portals.alerts.message') }} <span class="text-red-500">*</span>
          </label>
          <Textarea 
            id="message" 
            v-model="formData.message" 
            :placeholder="t('portals.alerts.messagePlaceholder')"
            :invalid="!!errors.message"
            rows="3"
          />
          <small v-if="errors.message" class="text-red-500">{{ errors.message }}</small>
        </div>

        <!-- Severity -->
        <div class="flex flex-col gap-2">
          <label for="severity" class="font-semibold text-sm">
            {{ t('portals.alerts.severity') }}
          </label>
          <Select 
            id="severity" 
            v-model="formData.severity" 
            :options="severityOptions" 
            optionLabel="label" 
            optionValue="value"
            :placeholder="t('portals.alerts.severityPlaceholder')"
          />
        </div>

        <!-- Icon -->
        <div class="flex flex-col gap-2">
          <label for="icon" class="font-semibold text-sm">
            {{ t('portals.alerts.icon') }}
          </label>
          <div class="flex items-center gap-2">
            <InputText 
              id="icon" 
              v-model="formData.icon" 
              :placeholder="t('portals.alerts.iconPlaceholder')"
              class="flex-1"
            />
            <i v-if="formData.icon" :class="formData.icon" class="text-xl text-primary"></i>
          </div>
          <small class="text-surface-400">{{ t('portals.alerts.iconHint') }}</small>
        </div>

        <!-- Active -->
        <div class="flex items-center gap-2">
          <Checkbox v-model="formData.is_active" inputId="is_active" :binary="true" />
          <label for="is_active" class="text-sm cursor-pointer">{{ t('common.active') }}</label>
        </div>
      </div>

      <template #footer>
        <Button 
          :label="t('common.cancel')" 
          severity="secondary" 
          text 
          @click="closeDialog" 
          :disabled="saving"
        />
        <Button 
          :label="t('common.save')" 
          icon="pi pi-check" 
          @click="saveAlert" 
          :loading="saving"
        />
      </template>
    </Dialog>

    <!-- Confirm Delete -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import portalsService from '@/services/portalsService'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()

// State
const loading = ref(true)
const alerts = ref([])
const dialogVisible = ref(false)
const dialogMode = ref('create')
const saving = ref(false)
const errors = ref({})

const formData = ref({
  code: '',
  message: '',
  severity: null,
  icon: '',
  is_active: true
})

const severityOptions = [
  { label: 'Info', value: 'info' },
  { label: 'Success', value: 'success' },
  { label: 'Warning', value: 'warn' },
  { label: 'Error', value: 'error' }
]

// Load alerts
const loadAlerts = async () => {
  loading.value = true
  try {
    alerts.value = await portalsService.listAlerts()
  } catch (error) {
    console.error('Failed to load alerts:', error)
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('portals.alerts.loadError'), life: 3000 })
  } finally {
    loading.value = false
  }
}

// Get severity color
const getSeverityColor = (severity) => {
  switch (severity) {
    case 'error': return 'danger'
    case 'warn': return 'warn'
    case 'info': return 'info'
    case 'success': return 'success'
    default: return 'secondary'
  }
}

// Open create dialog
const openCreateDialog = () => {
  formData.value = {
    code: '',
    message: '',
    severity: null,
    icon: '',
    is_active: true
  }
  errors.value = {}
  dialogMode.value = 'create'
  dialogVisible.value = true
}

// Open edit dialog
const openEditDialog = (alert) => {
  formData.value = { ...alert }
  errors.value = {}
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

// Close dialog
const closeDialog = () => {
  dialogVisible.value = false
}

// Validate form
const validateForm = () => {
  errors.value = {}
  
  if (!formData.value.code || !formData.value.code.trim()) {
    errors.value.code = t('errors.requiredField')
  } else if (!/^[a-z0-9_-]+$/i.test(formData.value.code)) {
    errors.value.code = t('portals.alerts.codeInvalid')
  }
  
  if (!formData.value.message || !formData.value.message.trim()) {
    errors.value.message = t('errors.requiredField')
  }
  
  return Object.keys(errors.value).length === 0
}

// Save alert
const saveAlert = async () => {
  if (!validateForm()) return
  
  saving.value = true
  try {
    if (dialogMode.value === 'create') {
      await portalsService.createAlert(formData.value)
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('portals.alerts.created'), life: 3000 })
    } else {
      await portalsService.updateAlert(formData.value.uuid, formData.value)
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('portals.alerts.updated'), life: 3000 })
    }
    closeDialog()
    await loadAlerts()
  } catch (error) {
    console.error('Failed to save alert:', error)
    if (error.response?.status === 400) {
      toast.add({ severity: 'error', summary: t('common.error'), detail: t('portals.alerts.codeExists'), life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: t('common.error'), detail: t('portals.alerts.saveError'), life: 3000 })
    }
  } finally {
    saving.value = false
  }
}

// Confirm delete
const confirmDelete = (alert) => {
  confirm.require({
    message: t('portals.alerts.confirmDelete', { code: alert.code }),
    header: t('common.delete'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteAlert(alert)
  })
}

// Delete alert
const deleteAlert = async (alert) => {
  try {
    await portalsService.deleteAlert(alert.uuid)
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('portals.alerts.deleted'), life: 3000 })
    await loadAlerts()
  } catch (error) {
    console.error('Failed to delete alert:', error)
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('portals.alerts.deleteError'), life: 3000 })
  }
}

// Lifecycle
onMounted(() => {
  loadAlerts()
})
</script>
