<template>
  <div class="workflows-list h-full flex flex-col">
    <Toolbar class="mb-4 mt-2 mx-2">
      <template #start>
        <Button 
          :label="$t('workflow.createWorkflow')" 
          icon="pi pi-plus" 
          @click="createWorkflow" 
        />
        <Button 
          icon="pi pi-refresh" 
          severity="secondary"
          text
          @click="loadWorkflows"
          :loading="loading"
          class="ml-2"
        />
      </template>
      <template #end>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="globalFilter" :placeholder="$t('common.search')" />
        </IconField>
      </template>
    </Toolbar>

    <DataTable
      :value="workflows"
      :loading="loading"
      :paginator="true"
      :rows="10"
      dataKey="uuid"
      stripedRows
      class="flex-1"
    >
      <Column field="name" :header="$t('workflow.name')" sortable>
        <template #body="{ data }">
          <div v-if="editingName === data.uuid" class="flex items-center gap-2">
            <InputText 
              v-model="editingNameValue" 
              class="w-full" 
              size="small"
              @keyup.enter="saveWorkflowName(data)"
              @keyup.escape="cancelEditName"
              @blur="saveWorkflowName(data)"
              autofocus
            />
          </div>
          <span 
            v-else 
            class="font-semibold cursor-pointer hover:text-primary-500 transition-colors"
            @click="startEditName(data)"
            :title="$t('common.clickToEdit')"
          >
            {{ data.name }}
          </span>
        </template>
      </Column>
      <Column field="entity_type" :header="$t('workflow.entityType')" sortable style="width: 160px">
        <template #body="{ data }">
          <span>{{ $t(`workflow.entityTypes.${data.entity_type}`, data.entity_type) }}</span>
        </template>
      </Column>
      <Column field="subtypeLabel" :header="$t('workflow.subtype')" sortable style="width: 150px">
        <template #body="{ data }">
          <Tag v-if="data.subtypeLabel" :value="data.subtypeLabel" severity="info" />
          <span v-else class="text-surface-400 italic text-sm">{{ $t('workflow.allSubtypesShort') }}</span>
        </template>
      </Column>
      <Column field="statusCount" :header="$t('workflow.statusCount')" sortable style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.statusCount || 0" severity="info" />
        </template>
      </Column>
      <Column field="transitionCount" :header="$t('workflow.transitionCount')" sortable style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.transitionCount || 0" severity="secondary" />
        </template>
      </Column>
      <Column field="is_active" :header="$t('common.isActive')" sortable style="width: 80px">
        <template #body="{ data }">
          <ToggleSwitch v-model="data.is_active" @change="toggleWorkflowActive(data)" />
        </template>
      </Column>
      <Column field="created_at" :header="$t('common.createdAt')" sortable style="width: 140px">
        <template #body="{ data }">
          <span class="text-sm text-surface-500">{{ formatDate(data.created_at) }}</span>
        </template>
      </Column>
      <Column field="updated_at" :header="$t('common.updatedAt')" sortable style="width: 140px">
        <template #body="{ data }">
          <span class="text-sm text-surface-500">{{ formatDate(data.updated_at) }}</span>
        </template>
      </Column>
      <Column :header="$t('common.actions')" style="width: 160px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text size="small" @click="editWorkflow(data)" :title="$t('common.edit')" />
          <Button icon="pi pi-copy" text size="small" @click="duplicateWorkflow(data)" :title="$t('common.duplicate')" />
          <Button icon="pi pi-trash" text size="small" severity="danger" @click="confirmDelete(data)" :title="$t('common.delete')" />
        </template>
      </Column>
    </DataTable>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="showDialog" :header="editingWorkflow ? $t('common.edit') : $t('workflow.createWorkflow')" modal :style="{ width: '500px' }">
      <div class="field mb-4">
        <label class="block mb-1 font-medium">{{ $t('workflow.name') }}</label>
        <InputText v-model="formData.name" class="w-full" />
      </div>
      <div class="field mb-4">
        <label class="block mb-1 font-medium">{{ $t('workflow.entityType') }}</label>
        <Select 
          v-model="formData.entity_type" 
          :options="entityTypeConfigs" 
          optionLabel="label" 
          optionValue="entity_type" 
          class="w-full"
          :placeholder="$t('workflow.selectEntityType')"
          @change="onEntityTypeChange"
        />
      </div>
      <div class="field mb-4" v-if="subtypeOptions.length > 0">
        <label class="block mb-1 font-medium">{{ $t('workflow.subtype') }}</label>
        <Select 
          v-model="formData.rel_entity_type_uuid" 
          :options="subtypeOptionsWithAll" 
          optionLabel="label" 
          optionValue="value" 
          optionGroupLabel="group"
          optionGroupChildren="items"
          class="w-full"
          :placeholder="$t('workflow.selectSubtype')"
          showClear
        />
      </div>
      <div class="field mb-4">
        <label class="block mb-1 font-medium">{{ $t('common.isActive') }}</label>
        <ToggleSwitch v-model="formData.is_active" />
      </div>
      <template #footer>
        <Button :label="$t('common.cancel')" text @click="showDialog = false" />
        <Button :label="$t('common.save')" @click="saveWorkflow" :loading="saving" />
      </template>
    </Dialog>

    <!-- Editor Dialog (full screen) -->
    <Dialog 
      v-model:visible="showEditor" 
      :header="editingWorkflow?.name" 
      modal 
      maximizable 
      :style="{ width: '95vw', height: '90vh' }"
      :pt="{ content: { style: 'height: calc(90vh - 6rem); padding: 0;' } }"
    >
      <WorkflowEditor 
        v-if="showEditor && editingWorkflow"
        :workflow-uuid="editingWorkflow.uuid" 
        @close="showEditor = false"
        @saved="onWorkflowSaved"
        class="h-full"
      />
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import WorkflowEditor from './WorkflowEditor.vue'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const { t, locale } = useI18n()
const confirm = useConfirm()
const toast = useToast()

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const workflows = ref([])
const loading = ref(false)
const globalFilter = ref('')
const showDialog = ref(false)
const showEditor = ref(false)
const editingWorkflow = ref(null)
const saving = ref(false)
const editingName = ref(null)
const editingNameValue = ref('')

const formData = ref({
  name: '',
  entity_type: '',
  rel_entity_type_uuid: null,
  is_active: true
})

const entityTypeConfigs = ref([])
const subtypeOptions = ref([])

const subtypeOptionsWithAll = computed(() => {
  if (subtypeOptions.value.length === 0) return []
  
  return [
    {
      group: t('workflow.allSubtypes'),
      items: [{ value: null, label: t('workflow.allSubtypesOption') }]
    },
    {
      group: t('workflow.specificSubtype'),
      items: subtypeOptions.value
    }
  ]
})

const loadEntityTypeConfigs = async () => {
  try {
    const response = await fetch('/api/v1/workflow-entity-config')
    if (response.ok) {
      const configs = await response.json()
      entityTypeConfigs.value = configs.map(c => ({
        ...c,
        label: t(`workflow.entityTypes.${c.entity_type}`, c.entity_type)
      }))
    }
  } catch (error) {
    console.error('Error loading entity type configs:', error)
  }
}

const loadSubtypes = async (entityType) => {
  if (!entityType) {
    subtypeOptions.value = []
    return
  }
  
  try {
    const response = await fetch(`/api/v1/workflow-entity-config/entity/${entityType}/subtypes?locale=${locale.value}`)
    if (response.ok) {
      subtypeOptions.value = await response.json()
    } else {
      subtypeOptions.value = []
    }
  } catch (error) {
    console.error('Error loading subtypes:', error)
    subtypeOptions.value = []
  }
}

const onEntityTypeChange = () => {
  formData.value.rel_entity_type_uuid = null
  loadSubtypes(formData.value.entity_type)
}

const loadWorkflows = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      locale: locale.value,
      active: 'false'
    })
    if (globalFilter.value?.trim()) {
      params.append('search', globalFilter.value.trim())
    }
    const response = await fetch(`/api/v1/workflows?${params}`)
    if (response.ok) {
      workflows.value = await response.json()
    }
  } catch (error) {
    console.error('Error loading workflows:', error)
  } finally {
    loading.value = false
  }
}

// Debounce search
let searchTimeout = null
watch(globalFilter, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadWorkflows()
  }, 300)
})

const createWorkflow = () => {
  editingWorkflow.value = null
  formData.value = { name: '', entity_type: '', rel_entity_type_uuid: null, is_active: true }
  subtypeOptions.value = []
  showDialog.value = true
}

const editWorkflow = (workflow) => {
  editingWorkflow.value = workflow
  showEditor.value = true
}

const saveWorkflow = async () => {
  saving.value = true
  try {
    const method = editingWorkflow.value ? 'PUT' : 'POST'
    const url = editingWorkflow.value 
      ? `/api/v1/workflows/${editingWorkflow.value.uuid}`
      : '/api/v1/workflows'
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData.value)
    })
    
    if (response.ok) {
      const saved = await response.json()
      showDialog.value = false
      await loadWorkflows()
      
      // Open editor for new workflow
      if (!editingWorkflow.value) {
        editingWorkflow.value = saved
        showEditor.value = true
      }
      
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.saved'), life: 3000 })
    }
  } catch (error) {
    console.error('Error saving workflow:', error)
    toast.add({ severity: 'error', summary: t('common.error'), life: 3000 })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (workflow) => {
  confirm.require({
    message: t('common.confirmDelete'),
    header: t('common.confirm'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteWorkflow(workflow)
  })
}

const deleteWorkflow = async (workflow) => {
  try {
    const response = await fetch(`/api/v1/workflows/${workflow.uuid}`, { method: 'DELETE' })
    if (response.ok) {
      await loadWorkflows()
      toast.add({ severity: 'success', summary: t('common.success'), life: 3000 })
    }
  } catch (error) {
    console.error('Error deleting workflow:', error)
  }
}

const onWorkflowSaved = () => {
  loadWorkflows()
  toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.saved'), life: 3000 })
}

const startEditName = (workflow) => {
  editingName.value = workflow.uuid
  editingNameValue.value = workflow.name
}

const cancelEditName = () => {
  editingName.value = null
  editingNameValue.value = ''
}

const saveWorkflowName = async (workflow) => {
  if (!editingNameValue.value.trim() || editingNameValue.value === workflow.name) {
    cancelEditName()
    return
  }
  
  try {
    const response = await fetch(`/api/v1/workflows/${workflow.uuid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingNameValue.value.trim() })
    })
    
    if (response.ok) {
      workflow.name = editingNameValue.value.trim()
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.saved'), life: 3000 })
    }
  } catch (error) {
    console.error('Error updating workflow name:', error)
    toast.add({ severity: 'error', summary: t('common.error'), life: 3000 })
  } finally {
    cancelEditName()
  }
}

const toggleWorkflowActive = async (workflow) => {
  try {
    const response = await fetch(`/api/v1/workflows/${workflow.uuid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: workflow.is_active })
    })
    
    if (response.ok) {
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.saved'), life: 3000 })
    } else {
      workflow.is_active = !workflow.is_active
      toast.add({ severity: 'error', summary: t('common.error'), life: 3000 })
    }
  } catch (error) {
    console.error('Error updating workflow active status:', error)
    workflow.is_active = !workflow.is_active
    toast.add({ severity: 'error', summary: t('common.error'), life: 3000 })
  }
}

const duplicateWorkflow = async (workflow) => {
  try {
    const response = await fetch(`/api/v1/workflows/${workflow.uuid}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      const newWorkflow = await response.json()
      workflows.value.unshift(newWorkflow)
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('workflow.duplicated'), life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: t('common.error'), life: 3000 })
    }
  } catch (error) {
    console.error('Error duplicating workflow:', error)
    toast.add({ severity: 'error', summary: t('common.error'), life: 3000 })
  }
}

onMounted(() => {
  loadWorkflows()
  loadEntityTypeConfigs()
})
</script>
