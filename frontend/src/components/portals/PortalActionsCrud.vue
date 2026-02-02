<template>
  <div class="h-full flex flex-col p-4 gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between shrink-0">
      <div>
        <h2 class="text-xl font-semibold text-surface-800 dark:text-surface-100">
          {{ t('portals.actions.title') }}
        </h2>
        <p class="text-sm text-surface-500">{{ t('portals.actions.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <Button 
          icon="pi pi-refresh" 
          severity="secondary" 
          text 
          rounded
          @click="loadActions"
          :loading="loading"
          v-tooltip.bottom="t('common.refresh')"
        />
        <Button 
          :label="t('portals.actions.add')" 
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
    <div v-else-if="actions.length === 0" class="flex-1 flex flex-col items-center justify-center text-surface-500">
      <i class="pi pi-bolt text-5xl mb-4 opacity-50"></i>
      <p class="text-lg font-medium">{{ t('portals.actions.empty') }}</p>
      <p class="text-sm">{{ t('portals.actions.emptyHint') }}</p>
    </div>

    <!-- Table -->
    <DataTable 
      v-else
      :value="actions" 
      dataKey="uuid"
      :paginator="actions.length > 10"
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
      size="small"
      stripedRows
      scrollable
      scrollHeight="flex"
      class="flex-1"
    >
      <Column field="code" :header="t('portals.actions.code')" sortable style="min-width: 120px">
        <template #body="{ data }">
          <code class="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">{{ data.code }}</code>
        </template>
      </Column>
      <Column field="label" :header="t('portals.actions.label')" sortable style="min-width: 150px" />
      <Column field="description" :header="t('portals.actions.description')" style="min-width: 200px">
        <template #body="{ data }">
          <span class="line-clamp-2">{{ data.description || '-' }}</span>
        </template>
      </Column>
      <Column field="icon" :header="t('portals.actions.icon')" style="width: 80px">
        <template #body="{ data }">
          <i v-if="data.icon" :class="data.icon" class="text-lg text-primary"></i>
          <span v-else class="text-surface-300">-</span>
        </template>
      </Column>
      <Column field="action_type" :header="t('portals.actions.type')" sortable style="width: 120px">
        <template #body="{ data }">
          <Tag 
            :value="data.action_type || '-'" 
            :severity="getTypeSeverity(data.action_type)" 
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
      :header="dialogMode === 'create' ? t('portals.actions.add') : t('portals.actions.edit')"
      :style="{ width: '550px' }"
      :modal="true"
      :closable="!saving"
    >
      <div class="flex flex-col gap-4">
        <!-- Code -->
        <div class="flex flex-col gap-2">
          <label for="code" class="font-semibold text-sm">
            {{ t('portals.actions.code') }} <span class="text-red-500">*</span>
          </label>
          <InputText 
            id="code" 
            v-model="formData.code" 
            :placeholder="t('portals.actions.codePlaceholder')"
            :invalid="!!errors.code"
            :disabled="dialogMode === 'edit'"
          />
          <small v-if="errors.code" class="text-red-500">{{ errors.code }}</small>
        </div>

        <!-- Label -->
        <div class="flex flex-col gap-2">
          <label for="label" class="font-semibold text-sm">
            {{ t('portals.actions.label') }} <span class="text-red-500">*</span>
          </label>
          <InputText 
            id="label" 
            v-model="formData.label" 
            :placeholder="t('portals.actions.labelPlaceholder')"
            :invalid="!!errors.label"
          />
          <small v-if="errors.label" class="text-red-500">{{ errors.label }}</small>
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-2">
          <label for="description" class="font-semibold text-sm">
            {{ t('portals.actions.description') }}
          </label>
          <Textarea 
            id="description" 
            v-model="formData.description" 
            :placeholder="t('portals.actions.descriptionPlaceholder')"
            rows="2"
          />
        </div>

        <!-- Icon -->
        <div class="flex flex-col gap-2">
          <label for="icon" class="font-semibold text-sm">
            {{ t('portals.actions.icon') }}
          </label>
          <div class="flex items-center gap-2">
            <InputText 
              id="icon" 
              v-model="formData.icon" 
              :placeholder="t('portals.actions.iconPlaceholder')"
              class="flex-1"
            />
            <i v-if="formData.icon" :class="formData.icon" class="text-xl text-primary"></i>
          </div>
          <small class="text-surface-400">{{ t('portals.actions.iconHint') }}</small>
        </div>

        <!-- Action Type -->
        <div class="flex flex-col gap-2">
          <label for="action_type" class="font-semibold text-sm">
            {{ t('portals.actions.type') }}
          </label>
          <Select 
            id="action_type" 
            v-model="formData.action_type" 
            :options="actionTypeOptions" 
            optionLabel="label" 
            optionValue="value"
            :placeholder="t('portals.actions.typePlaceholder')"
          />
        </div>

        <!-- Action URL -->
        <div class="flex flex-col gap-2">
          <label for="action_url" class="font-semibold text-sm">
            {{ t('portals.actions.url') }}
          </label>
          <InputText 
            id="action_url" 
            v-model="formData.action_url" 
            :placeholder="t('portals.actions.urlPlaceholder')"
          />
          <small class="text-surface-400">{{ t('portals.actions.urlHint') }}</small>
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
          @click="saveAction" 
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
const actions = ref([])
const dialogVisible = ref(false)
const dialogMode = ref('create')
const saving = ref(false)
const errors = ref({})

const formData = ref({
  code: '',
  label: '',
  description: '',
  icon: '',
  action_type: null,
  action_url: '',
  is_active: true
})

const actionTypeOptions = [
  { label: 'Link', value: 'link' },
  { label: 'Form', value: 'form' },
  { label: 'Chat', value: 'chat' },
  { label: 'Drawer', value: 'drawer' }
]

// Load actions
const loadActions = async () => {
  loading.value = true
  try {
    actions.value = await portalsService.listActions()
  } catch (error) {
    console.error('Failed to load actions:', error)
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('portals.actions.loadError'), life: 3000 })
  } finally {
    loading.value = false
  }
}

// Get type severity
const getTypeSeverity = (type) => {
  switch (type) {
    case 'link': return 'info'
    case 'form': return 'success'
    case 'chat': return 'warn'
    case 'drawer': return 'contrast'
    default: return 'secondary'
  }
}

// Open create dialog
const openCreateDialog = () => {
  formData.value = {
    code: '',
    label: '',
    description: '',
    icon: '',
    action_type: null,
    action_url: '',
    is_active: true
  }
  errors.value = {}
  dialogMode.value = 'create'
  dialogVisible.value = true
}

// Open edit dialog
const openEditDialog = (action) => {
  formData.value = { ...action }
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
    errors.value.code = t('portals.actions.codeInvalid')
  }
  
  if (!formData.value.label || !formData.value.label.trim()) {
    errors.value.label = t('errors.requiredField')
  }
  
  return Object.keys(errors.value).length === 0
}

// Save action
const saveAction = async () => {
  if (!validateForm()) return
  
  saving.value = true
  try {
    if (dialogMode.value === 'create') {
      await portalsService.createAction(formData.value)
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('portals.actions.created'), life: 3000 })
    } else {
      await portalsService.updateAction(formData.value.uuid, formData.value)
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('portals.actions.updated'), life: 3000 })
    }
    closeDialog()
    await loadActions()
  } catch (error) {
    console.error('Failed to save action:', error)
    if (error.response?.status === 400) {
      toast.add({ severity: 'error', summary: t('common.error'), detail: t('portals.actions.codeExists'), life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: t('common.error'), detail: t('portals.actions.saveError'), life: 3000 })
    }
  } finally {
    saving.value = false
  }
}

// Confirm delete
const confirmDelete = (action) => {
  confirm.require({
    message: t('portals.actions.confirmDelete', { code: action.code }),
    header: t('common.delete'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteAction(action)
  })
}

// Delete action
const deleteAction = async (action) => {
  try {
    await portalsService.deleteAction(action.uuid)
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('portals.actions.deleted'), life: 3000 })
    await loadActions()
  } catch (error) {
    console.error('Failed to delete action:', error)
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('portals.actions.deleteError'), life: 3000 })
  }
}

// Lifecycle
onMounted(() => {
  loadActions()
})
</script>
