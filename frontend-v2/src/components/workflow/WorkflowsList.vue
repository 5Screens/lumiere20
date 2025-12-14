<template>
  <div class="workflows-list h-full flex flex-col">
    <Toolbar class="mb-4">
      <template #start>
        <Button 
          :label="$t('workflow.createWorkflow')" 
          icon="pi pi-plus" 
          @click="createWorkflow" 
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
      :globalFilter="globalFilter"
      dataKey="uuid"
      stripedRows
      class="flex-1"
    >
      <Column field="name" :header="$t('common.name')" sortable>
        <template #body="{ data }">
          <span class="font-semibold">{{ data.name }}</span>
        </template>
      </Column>
      <Column field="entity_type" :header="$t('workflow.entityType')" sortable />
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
          <i :class="data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" />
        </template>
      </Column>
      <Column :header="$t('common.actions')" style="width: 120px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text size="small" @click="editWorkflow(data)" />
          <Button icon="pi pi-trash" text size="small" severity="danger" @click="confirmDelete(data)" />
        </template>
      </Column>
    </DataTable>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="showDialog" :header="editingWorkflow ? $t('common.edit') : $t('workflow.createWorkflow')" modal :style="{ width: '500px' }">
      <div class="field mb-4">
        <label class="block mb-1 font-medium">{{ $t('common.name') }}</label>
        <InputText v-model="formData.name" class="w-full" />
      </div>
      <div class="field mb-4">
        <label class="block mb-1 font-medium">{{ $t('workflow.entityType') }}</label>
        <Select v-model="formData.entity_type" :options="entityTypes" optionLabel="label" optionValue="value" class="w-full" />
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
import { ref, onMounted } from 'vue'
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

const workflows = ref([])
const loading = ref(false)
const globalFilter = ref('')
const showDialog = ref(false)
const showEditor = ref(false)
const editingWorkflow = ref(null)
const saving = ref(false)

const formData = ref({
  name: '',
  entity_type: '',
  is_active: true
})

const entityTypes = [
  { label: 'CI Types', value: 'ci_types' },
  { label: 'Ticket Types', value: 'ticket_types' },
  { label: 'Persons', value: 'persons' },
  { label: 'Locations', value: 'locations' },
  { label: 'Entities', value: 'entities' }
]

const loadWorkflows = async () => {
  loading.value = true
  try {
    const response = await fetch(`/api/v1/workflows?locale=${locale.value}`)
    if (response.ok) {
      workflows.value = await response.json()
    }
  } catch (error) {
    console.error('Error loading workflows:', error)
  } finally {
    loading.value = false
  }
}

const createWorkflow = () => {
  editingWorkflow.value = null
  formData.value = { name: '', entity_type: '', is_active: true }
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

onMounted(() => {
  loadWorkflows()
})
</script>
