<template>
  <div class="workflow-editor h-full flex flex-col">
    <!-- Header (Zone C) -->
    <div class="workflow-header flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
      <!-- Left spacer for balance -->
      <div class="flex-1"></div>
      
      <!-- Center: Add buttons -->
      <div class="flex items-center gap-2">
        <Button
          :label="$t('workflow.addStatus')"
          icon="pi pi-plus"
          severity="secondary"
          size="small"
          @click="showAddStatusDialog = true"
        />
        <Button
          :label="$t('workflow.addTransition')"
          icon="pi pi-arrow-right"
          severity="secondary"
          size="small"
          @click="showAddTransitionDialog = true"
        />
      </div>
      
      <!-- Right: Save/Close buttons -->
      <div class="flex-1 flex items-center justify-end gap-2">
        <Button
          :label="$t('common.save')"
          icon="pi pi-save"
          severity="primary"
          size="small"
          @click="saveWorkflow"
          :loading="saving"
          :disabled="!isDirty"
        />
        <Button
          :label="$t('common.close')"
          icon="pi pi-times"
          severity="secondary"
          size="small"
          text
          @click="handleClose"
        />
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex min-h-0">
      <!-- Canvas (Zone A) -->
      <div class="flex-1 relative min-h-[400px]" ref="canvasContainer">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :default-viewport="{ zoom: 1, x: 50, y: 50 }"
          :min-zoom="0.2"
          :max-zoom="2"
          :snap-to-grid="true"
          :snap-grid="[20, 20]"
          :apply-default="false"
          fit-view-on-init
          @node-click="onNodeClick"
          @edge-click="onEdgeClick"
          @pane-click="onPaneClick"
          @node-drag-stop="onNodeDragStop"
          @connect="onConnect"
        >
          <Background :gap="20" />
          <MiniMap 
            :node-color="getNodeColor"
            :node-stroke-color="getNodeStrokeColor"
            position="bottom-right"
          />
          <Controls position="bottom-left" />
          
          <!-- Custom node template -->
          <template #node-status="{ data }">
            <StatusNode 
              :data="data" 
              :selected="selectedElement?.type === 'status' && selectedElement?.uuid === data.uuid"
              @edit="editStatus(data)"
            />
          </template>
          
          <!-- Custom edge template -->
          <template #edge-transition="{ data, sourceX, sourceY, targetX, targetY }">
            <TransitionEdge
              :data="data"
              :source-x="sourceX"
              :source-y="sourceY"
              :target-x="targetX"
              :target-y="targetY"
              :selected="selectedElement?.type === 'transition' && selectedElement?.uuid === data.uuid"
            />
          </template>
        </VueFlow>
      </div>

      <!-- Side Panel (Zone B) -->
      <div 
        class="side-panel border-l border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 transition-all duration-300"
        :class="panelOpen ? 'w-80' : 'w-0'"
      >
        <div v-if="panelOpen" class="h-full overflow-y-auto">
          <!-- Toggle button -->
          <button
            class="absolute -left-6 top-4 w-6 h-12 bg-primary-500 text-white rounded-l flex items-center justify-center hover:bg-primary-600 transition-colors"
            @click="panelOpen = false"
          >
            <i class="pi pi-chevron-right text-sm" />
          </button>
          
          <!-- Status Panel -->
          <StatusPanel
            v-if="selectedElement?.type === 'status'"
            :status="selectedStatus"
            :categories="statusCategories"
            :transitions="getStatusTransitions(selectedStatus?.uuid)"
            @update="updateStatus"
            @delete="deleteStatus"
            @add-transition="showAddTransitionDialog = true"
            @add-action="onAddAction"
            @edit-action="onEditAction"
            @delete-action="onDeleteAction"
            @toggle-action-active="onToggleActionActive"
          />
          
          <!-- Transition Panel -->
          <TransitionPanel
            v-if="selectedElement?.type === 'transition'"
            :transition="selectedTransition"
            :statuses="workflow?.statuses || []"
            @update="updateTransition"
            @delete="deleteTransition"
            @add-action="onAddAction"
            @edit-action="onEditAction"
            @delete-action="onDeleteAction"
            @toggle-action-active="onToggleActionActive"
          />
          
          <!-- Empty state -->
          <div v-if="!selectedElement" class="p-4 text-center text-surface-500">
            <i class="pi pi-info-circle text-2xl mb-2" />
            <p>{{ $t('workflow.selectElement') }}</p>
          </div>
        </div>
      </div>
      
      <!-- Panel toggle when closed -->
      <button
        v-if="!panelOpen && selectedElement"
        class="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-primary-500 text-white rounded-l flex items-center justify-center hover:bg-primary-600 transition-colors z-10"
        @click="panelOpen = true"
      >
        <i class="pi pi-chevron-left text-sm" />
      </button>
    </div>

    <!-- Add Status Dialog -->
    <AddStatusDialog
      v-model:visible="showAddStatusDialog"
      :categories="statusCategories"
      @add="addStatus"
    />

    <!-- Add Transition Dialog -->
    <AddTransitionDialog
      v-model:visible="showAddTransitionDialog"
      :statuses="workflow?.statuses || []"
      :pre-selected-source="preSelectedTransitionSource"
      :pre-selected-target="preSelectedTransitionTarget"
      @add="addTransition"
    />

    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import { storeToRefs } from 'pinia'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

import { useWorkflowEditorStore } from '@/stores/workflowEditorStore'

import StatusNode from './nodes/StatusNode.vue'
import TransitionEdge from './edges/TransitionEdge.vue'
import StatusPanel from './panels/StatusPanel.vue'
import TransitionPanel from './panels/TransitionPanel.vue'
import AddStatusDialog from './dialogs/AddStatusDialog.vue'
import AddTransitionDialog from './dialogs/AddTransitionDialog.vue'

import Button from 'primevue/button'
import Divider from 'primevue/divider'

const props = defineProps({
  workflowUuid: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const { t, locale } = useI18n()
const confirm = useConfirm()

// Store
const store = useWorkflowEditorStore()
const { workflow, statusCategories, saving, isDirty } = storeToRefs(store)

// Vue Flow hooks for handling changes with confirmation
const { onNodesChange, onEdgesChange, applyNodeChanges, applyEdgeChanges } = useVueFlow()

// Local UI state
const nodes = ref([])
const edges = ref([])
const selectedElement = ref(null)
const panelOpen = ref(false)
const showAddStatusDialog = ref(false)
const showAddTransitionDialog = ref(false)
const preSelectedTransitionSource = ref(null)
const preSelectedTransitionTarget = ref(null)

// Computed
const selectedStatus = computed(() => {
  if (selectedElement.value?.type !== 'status') return null
  return workflow.value?.statuses?.find(s => s.uuid === selectedElement.value.uuid)
})

const selectedTransition = computed(() => {
  if (selectedElement.value?.type !== 'transition') return null
  return workflow.value?.transitions?.find(t => t.uuid === selectedElement.value.uuid)
})

// Methods
const loadWorkflow = async () => {
  await store.loadWorkflow(props.workflowUuid, locale.value)
  buildFlowFromWorkflow()
}

const loadStatusCategories = async () => {
  await store.loadStatusCategories(locale.value)
}

const buildFlowFromWorkflow = () => {
  if (!workflow.value) return
  
  // Build nodes from statuses
  nodes.value = workflow.value.statuses.map(status => ({
    id: status.uuid,
    type: 'status',
    position: { x: status.position_x || 0, y: status.position_y || 0 },
    data: {
      uuid: status.uuid,
      name: status.name,
      category: status.category,
      allow_all_inbound: status.allow_all_inbound,
      is_initial: status.is_initial,
      on_enter_actions: status.on_enter_actions || [],
      on_exit_actions: status.on_exit_actions || []
    }
  }))
  
  // Build edges from transitions
  edges.value = []
  for (const transition of workflow.value.transitions) {
    for (const source of transition.sources) {
      edges.value.push({
        id: `${transition.uuid}-${source.from_status.uuid}`,
        type: 'transition',
        source: source.from_status.uuid,
        target: transition.to_status.uuid,
        data: {
          uuid: transition.uuid,
          name: transition.name,
          sourceUuid: source.from_status.uuid,
          actions: transition.actions || []
        }
      })
    }
  }
}

const getNodeColor = (node) => {
  return node.data?.category?.color || '#6b7280'
}

const getNodeStrokeColor = (node) => {
  // Check if orphan (no incoming transitions and not allow_all_inbound)
  const hasIncoming = edges.value.some(e => e.target === node.id)
  const allowAllInbound = node.data?.allow_all_inbound
  if (!hasIncoming && !allowAllInbound && !node.data?.is_initial) {
    return '#ef4444' // Red for orphan
  }
  return node.data?.category?.color || '#6b7280'
}

const onNodeClick = (event) => {
  selectedElement.value = { type: 'status', uuid: event.node.id }
  panelOpen.value = true
}

const onEdgeClick = (event) => {
  selectedElement.value = { type: 'transition', uuid: event.edge.data.uuid }
  panelOpen.value = true
}

const onPaneClick = () => {
  selectedElement.value = null
  panelOpen.value = false
}

const onNodeDragStop = async (event) => {
  const node = event.node
  const status = workflow.value?.statuses?.find(s => s.uuid === node.id)
  if (status) {
    status.position_x = node.position.x
    status.position_y = node.position.y
    // Auto-save position
    await updateStatusPosition(node.id, node.position.x, node.position.y)
  }
}

const onConnect = (params) => {
  // Open add transition dialog with pre-selected source and target
  preSelectedTransitionSource.value = params.source
  preSelectedTransitionTarget.value = params.target
  showAddTransitionDialog.value = true
}

const getStatusTransitions = (statusUuid) => {
  if (!statusUuid || !workflow.value?.transitions) return []
  return workflow.value.transitions.filter(t => 
    t.to_status.uuid === statusUuid || 
    t.sources.some(s => s.from_status.uuid === statusUuid)
  )
}

const addStatus = (statusData) => {
  store.addStatus(statusData)
  buildFlowFromWorkflow()
  showAddStatusDialog.value = false
}

const updateStatus = (statusData) => {
  store.updateStatus(statusData)
  buildFlowFromWorkflow()
}

const updateStatusPosition = (statusUuid, x, y) => {
  store.updateStatusPosition(statusUuid, x, y)
}

const deleteStatus = (statusUuid) => {
  store.deleteStatus(statusUuid)
  selectedElement.value = null
  panelOpen.value = false
  buildFlowFromWorkflow()
}

const addTransition = (transitionData) => {
  store.addTransition(transitionData)
  buildFlowFromWorkflow()
  showAddTransitionDialog.value = false
  preSelectedTransitionSource.value = null
  preSelectedTransitionTarget.value = null
}

const updateTransition = (transitionData) => {
  store.updateTransition(transitionData)
  buildFlowFromWorkflow()
}

const deleteTransition = (transitionUuid) => {
  store.deleteTransition(transitionUuid)
  selectedElement.value = null
  panelOpen.value = false
  buildFlowFromWorkflow()
}

// ============================================
// ACTION HANDLERS
// ============================================
const onAddAction = (actionData) => {
  store.addAction(actionData)
}

const onEditAction = (action) => {
  // TODO: open edit action dialog
  console.log('Edit action:', action)
}

const onDeleteAction = (actionUuid) => {
  store.deleteAction(actionUuid)
}

const onToggleActionActive = (actionUuid, isActive) => {
  store.updateAction(actionUuid, { is_active: isActive })
}

const saveWorkflow = async () => {
  const success = await store.saveWorkflow()
  if (success) {
    buildFlowFromWorkflow()
    emit('saved')
  }
}

// Handle close with unsaved changes warning
const handleClose = () => {
  if (isDirty.value) {
    confirm.require({
      message: t('workflow.unsavedChangesWarning'),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-danger',
      acceptLabel: t('workflow.closeWithoutSaving'),
      rejectLabel: t('common.cancel'),
      accept: () => emit('close')
    })
  } else {
    emit('close')
  }
}

// Handle node changes with confirmation for deletions
onNodesChange((changes) => {
  const nextChanges = []
  
  for (const change of changes) {
    if (change.type === 'remove') {
      // Find the status UUID from the node id
      const node = nodes.value.find(n => n.id === change.id)
      if (node) {
        const statusUuid = node.data?.uuid
        if (statusUuid) {
          // Show confirmation using PrimeVue ConfirmDialog
          confirm.require({
            message: t('workflow.confirmDeleteStatus'),
            header: t('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            acceptClass: 'p-button-danger',
            accept: () => deleteStatus(statusUuid)
          })
          // Don't apply the change - deletion handled by API
          return
        }
      }
    } else {
      nextChanges.push(change)
    }
  }
  
  applyNodeChanges(nextChanges)
})

// Handle edge changes with confirmation for deletions
onEdgesChange((changes) => {
  const nextChanges = []
  
  for (const change of changes) {
    if (change.type === 'remove') {
      // Find the transition UUID from the edge id
      const edge = edges.value.find(e => e.id === change.id)
      if (edge) {
        const transitionUuid = edge.data?.uuid
        if (transitionUuid) {
          // Show confirmation using PrimeVue ConfirmDialog
          confirm.require({
            message: t('workflow.confirmDeleteTransition'),
            header: t('common.confirm'),
            icon: 'pi pi-exclamation-triangle',
            acceptClass: 'p-button-danger',
            accept: () => deleteTransition(transitionUuid)
          })
          // Don't apply the change - deletion handled by API
          return
        }
      }
    } else {
      nextChanges.push(change)
    }
  }
  
  applyEdgeChanges(nextChanges)
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadStatusCategories(),
    loadWorkflow()
  ])
})

onUnmounted(() => {
  store.clear()
})

// Watch for workflow UUID changes
watch(() => props.workflowUuid, () => {
  loadWorkflow()
})

// Watch for workflow changes to rebuild flow
watch(() => workflow.value?.statuses, () => {
  buildFlowFromWorkflow()
}, { deep: true })
</script>

<style scoped>
.workflow-editor {
  background: var(--p-surface-0);
}

 .workflow-header {
   background: var(--p-surface-50);
 }

 [data-theme="dark"] .workflow-header {
   background: var(--p-surface-900) !important;
 }

.vue-flow {
  background: var(--p-surface-100);
}

[data-theme="dark"] .vue-flow {
  background: var(--p-surface-900) !important;
}

[data-theme="dark"] .vue-flow__background {
  background-color: var(--p-surface-900) !important;
}

[data-theme="dark"] .vue-flow__background-pattern {
  color: var(--p-surface-700) !important;
}

.vue-flow__minimap {
  background: var(--p-surface-50);
  border: 1px solid var(--p-surface-200);
  border-radius: 8px;
}

[data-theme="dark"] .vue-flow__minimap {
  background: var(--p-surface-800) !important;
  border-color: var(--p-surface-700) !important;
}

.vue-flow__controls {
  background: var(--p-surface-50);
  border: 1px solid var(--p-surface-200);
  border-radius: 8px;
}

[data-theme="dark"] .vue-flow__controls {
  background: var(--p-surface-800) !important;
  border-color: var(--p-surface-700) !important;
}

.vue-flow__controls-button {
  background: var(--p-surface-0);
  border: none;
}

[data-theme="dark"] .vue-flow__controls-button {
  background: var(--p-surface-900) !important;
  color: var(--p-surface-0) !important;
}

.vue-flow__controls-button:hover {
  background: var(--p-surface-100);
}

[data-theme="dark"] .vue-flow__controls-button:hover {
  background: var(--p-surface-700) !important;
}

.side-panel {
  overflow: hidden;
}

 .side-panel {
   background: var(--p-surface-50);
 }

 [data-theme="dark"] .side-panel {
   background: var(--p-surface-900) !important;
 }
</style>
