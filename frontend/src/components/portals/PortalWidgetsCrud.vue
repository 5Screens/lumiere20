<template>
  <div class="h-full flex flex-col p-4 gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between shrink-0">
      <div>
        <h2 class="text-xl font-semibold text-surface-800 dark:text-surface-100">
          {{ t('portals.widgets.title') }}
        </h2>
        <p class="text-sm text-surface-500">{{ t('portals.widgets.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <Button 
          icon="pi pi-refresh" 
          severity="secondary" 
          text 
          rounded
          @click="loadWidgets"
          :loading="loading"
          v-tooltip.bottom="t('common.refresh')"
        />
        <Button 
          :label="t('portals.widgets.add')" 
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
    <div v-else-if="widgets.length === 0" class="flex-1 flex flex-col items-center justify-center text-surface-500">
      <i class="pi pi-th-large text-5xl mb-4 opacity-50"></i>
      <p class="text-lg font-medium">{{ t('portals.widgets.empty') }}</p>
      <p class="text-sm">{{ t('portals.widgets.emptyHint') }}</p>
    </div>

    <!-- Table -->
    <DataTable 
      v-else
      :value="widgets" 
      dataKey="uuid"
      :paginator="widgets.length > 10"
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
      size="small"
      stripedRows
      scrollable
      scrollHeight="flex"
      class="flex-1"
    >
      <Column field="code" :header="t('portals.widgets.code')" sortable style="min-width: 120px">
        <template #body="{ data }">
          <code class="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">{{ data.code }}</code>
        </template>
      </Column>
      <Column field="title" :header="t('portals.widgets.widgetTitle')" sortable style="min-width: 150px" />
      <Column field="description" :header="t('portals.widgets.description')" style="min-width: 200px">
        <template #body="{ data }">
          <span class="line-clamp-2">{{ data.description || '-' }}</span>
        </template>
      </Column>
      <Column field="icon" :header="t('portals.widgets.icon')" style="width: 80px">
        <template #body="{ data }">
          <i v-if="data.icon" :class="data.icon" class="text-lg text-primary"></i>
          <span v-else class="text-surface-300">-</span>
        </template>
      </Column>
      <Column field="widget_type" :header="t('portals.widgets.type')" sortable style="width: 120px">
        <template #body="{ data }">
          <Tag 
            :value="data.widget_type || '-'" 
            :severity="getTypeSeverity(data.widget_type)" 
          />
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
      :header="dialogMode === 'create' ? t('portals.widgets.add') : t('portals.widgets.edit')"
      :style="{ width: '550px' }"
      :modal="true"
      :closable="!saving"
    >
      <div class="flex flex-col gap-4">
        <!-- Code -->
        <div class="flex flex-col gap-2">
          <label for="code" class="font-semibold text-sm">
            {{ t('portals.widgets.code') }} <span class="text-red-500">*</span>
          </label>
          <InputText 
            id="code" 
            v-model="formData.code" 
            :placeholder="t('portals.widgets.codePlaceholder')"
            :invalid="!!errors.code"
            :disabled="dialogMode === 'edit'"
          />
          <small v-if="errors.code" class="text-red-500">{{ errors.code }}</small>
        </div>

        <!-- Title -->
        <div class="flex flex-col gap-2">
          <label for="title" class="font-semibold text-sm">
            {{ t('portals.widgets.widgetTitle') }} <span class="text-red-500">*</span>
          </label>
          <InputText 
            id="title" 
            v-model="formData.title" 
            :placeholder="t('portals.widgets.titlePlaceholder')"
            :invalid="!!errors.title"
          />
          <small v-if="errors.title" class="text-red-500">{{ errors.title }}</small>
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-2">
          <label for="description" class="font-semibold text-sm">
            {{ t('portals.widgets.description') }}
          </label>
          <Textarea 
            id="description" 
            v-model="formData.description" 
            :placeholder="t('portals.widgets.descriptionPlaceholder')"
            rows="2"
          />
        </div>

        <!-- Icon -->
        <div class="flex flex-col gap-2">
          <label for="icon" class="font-semibold text-sm">
            {{ t('portals.widgets.icon') }}
          </label>
          <div class="flex items-center gap-2">
            <InputText 
              id="icon" 
              v-model="formData.icon" 
              :placeholder="t('portals.widgets.iconPlaceholder')"
              class="flex-1"
            />
            <i v-if="formData.icon" :class="formData.icon" class="text-xl text-primary"></i>
          </div>
          <small class="text-surface-400">{{ t('portals.widgets.iconHint') }}</small>
        </div>

        <!-- Widget Type -->
        <div class="flex flex-col gap-2">
          <label for="widget_type" class="font-semibold text-sm">
            {{ t('portals.widgets.type') }}
          </label>
          <Select 
            id="widget_type" 
            v-model="formData.widget_type" 
            :options="widgetTypeOptions" 
            optionLabel="label" 
            optionValue="value"
            :placeholder="t('portals.widgets.typePlaceholder')"
          />
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
          @click="saveWidget" 
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
const widgets = ref([])
const dialogVisible = ref(false)
const dialogMode = ref('create')
const saving = ref(false)
const errors = ref({})

const formData = ref({
  code: '',
  title: '',
  description: '',
  icon: '',
  widget_type: null,
  is_active: true
})

const widgetTypeOptions = [
  { label: 'Chart', value: 'chart' },
  { label: 'Stats', value: 'stats' },
  { label: 'List', value: 'list' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Custom', value: 'custom' }
]

// Load widgets
const loadWidgets = async () => {
  loading.value = true
  try {
    widgets.value = await portalsService.listWidgets()
  } catch (error) {
    console.error('Failed to load widgets:', error)
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('portals.widgets.loadError'), life: 3000 })
  } finally {
    loading.value = false
  }
}

// Get type severity
const getTypeSeverity = (type) => {
  switch (type) {
    case 'chart': return 'info'
    case 'stats': return 'success'
    case 'list': return 'warn'
    case 'calendar': return 'contrast'
    case 'custom': return 'secondary'
    default: return 'secondary'
  }
}

// Open create dialog
const openCreateDialog = () => {
  formData.value = {
    code: '',
    title: '',
    description: '',
    icon: '',
    widget_type: null,
    is_active: true
  }
  errors.value = {}
  dialogMode.value = 'create'
  dialogVisible.value = true
}

// Open edit dialog
const openEditDialog = (widget) => {
  formData.value = { ...widget }
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
    errors.value.code = t('portals.widgets.codeInvalid')
  }
  
  if (!formData.value.title || !formData.value.title.trim()) {
    errors.value.title = t('errors.requiredField')
  }
  
  return Object.keys(errors.value).length === 0
}

// Save widget
const saveWidget = async () => {
  if (!validateForm()) return
  
  saving.value = true
  try {
    if (dialogMode.value === 'create') {
      await portalsService.createWidget(formData.value)
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('portals.widgets.created'), life: 3000 })
    } else {
      await portalsService.updateWidget(formData.value.uuid, formData.value)
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('portals.widgets.updated'), life: 3000 })
    }
    closeDialog()
    await loadWidgets()
  } catch (error) {
    console.error('Failed to save widget:', error)
    if (error.response?.status === 400) {
      toast.add({ severity: 'error', summary: t('common.error'), detail: t('portals.widgets.codeExists'), life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: t('common.error'), detail: t('portals.widgets.saveError'), life: 3000 })
    }
  } finally {
    saving.value = false
  }
}

// Confirm delete
const confirmDelete = (widget) => {
  confirm.require({
    message: t('portals.widgets.confirmDelete', { code: widget.code }),
    header: t('common.delete'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteWidget(widget)
  })
}

// Delete widget
const deleteWidget = async (widget) => {
  try {
    await portalsService.deleteWidget(widget.uuid)
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('portals.widgets.deleted'), life: 3000 })
    await loadWidgets()
  } catch (error) {
    console.error('Failed to delete widget:', error)
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('portals.widgets.deleteError'), life: 3000 })
  }
}

// Lifecycle
onMounted(() => {
  loadWidgets()
})
</script>
