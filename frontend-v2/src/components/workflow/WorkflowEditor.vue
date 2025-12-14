<template>
  <div class="workflow-editor h-full flex flex-col">
    <!-- Header (Zone C) -->
    <div class="workflow-header flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
      <div class="flex items-center gap-4">
        <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-200">
          {{ workflow?.name || $t('workflow.newWorkflow') }}
        </h2>
      </div>
      
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
        <Divider layout="vertical" class="mx-2" />
        <Button
          :label="$t('common.save')"
          icon="pi pi-save"
          severity="primary"
          size="small"
          @click="saveWorkflow"
          :loading="saving"
        />
        <Button
          :label="$t('common.close')"
          icon="pi pi-times"
          severity="secondary"
          size="small"
          text
          @click="$emit('close')"
        />
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex min-h-0">
      <!-- Canvas (Zone A) -->
      <div class="flex-1 relative" ref="canvasContainer">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :default-viewport="{ zoom: 1, x: 50, y: 50 }"
          :min-zoom="0.2"
          :max-zoom="2"
          :snap-to-grid="true"
          :snap-grid="[20, 20]"
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
          />
          
          <!-- Transition Panel -->
          <TransitionPanel
            v-if="selectedElement?.type === 'transition'"
            :transition="selectedTransition"
            :statuses="workflow?.statuses || []"
            @update="updateTransition"
            @delete="deleteTransition"
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
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

import StatusNode from './nodes/StatusNode.vue'
import TransitionEdge from './edges/TransitionEdge.vue'
import StatusPanel from './panels/StatusPanel.vue'
import TransitionPanel from './panels/TransitionPanel.vue'
import AddStatusDialog from './dialogs/AddStatusDialog.vue'
import AddTransitionDialog from './dialogs/AddTransitionDialog.vue'

const props = defineProps({
  workflowUuid: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const { t, locale } = useI18n()

// State
const workflow = ref(null)
const statusCategories = ref([])
const nodes = ref([])
const edges = ref([])
const selectedElement = ref(null)
const panelOpen = ref(false)
const saving = ref(false)
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
  if (!props.workflowUuid) {
    // New workflow - initialize with default structure
    workflow.value = {
      name: '',
      description: '',
      entity_type: '',
      statuses: [],
      transitions: []
    }
    return
  }
  
  try {
    const response = await fetch(`/api/v1/workflows/${props.workflowUuid}?locale=${locale.value}`)
    if (response.ok) {
      workflow.value = await response.json()
      buildFlowFromWorkflow()
    }
  } catch (error) {
    console.error('Error loading workflow:', error)
  }
}

const loadStatusCategories = async () => {
  try {
    const response = await fetch(`/api/v1/workflow-status-categories?locale=${locale.value}`)
    if (response.ok) {
      statusCategories.value = await response.json()
    }
  } catch (error) {
    console.error('Error loading status categories:', error)
  }
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
      is_initial: status.is_initial
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
          sourceUuid: source.from_status.uuid
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

const addStatus = async (statusData) => {
  try {
    const response = await fetch(`/api/v1/workflows/${props.workflowUuid}/statuses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...statusData,
        position_x: 100 + (workflow.value?.statuses?.length || 0) * 200,
        position_y: 100
      })
    })
    
    if (response.ok) {
      await loadWorkflow()
      showAddStatusDialog.value = false
    }
  } catch (error) {
    console.error('Error adding status:', error)
  }
}

const updateStatus = async (statusData) => {
  try {
    const response = await fetch(`/api/v1/workflows/${props.workflowUuid}/statuses/${statusData.uuid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusData)
    })
    
    if (response.ok) {
      await loadWorkflow()
    }
  } catch (error) {
    console.error('Error updating status:', error)
  }
}

const updateStatusPosition = async (statusUuid, x, y) => {
  try {
    await fetch(`/api/v1/workflows/${props.workflowUuid}/statuses/${statusUuid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position_x: x, position_y: y })
    })
  } catch (error) {
    console.error('Error updating status position:', error)
  }
}

const deleteStatus = async (statusUuid) => {
  try {
    const response = await fetch(`/api/v1/workflows/${props.workflowUuid}/statuses/${statusUuid}`, {
      method: 'DELETE'
    })
    
    if (response.ok) {
      selectedElement.value = null
      panelOpen.value = false
      await loadWorkflow()
    }
  } catch (error) {
    console.error('Error deleting status:', error)
  }
}

const addTransition = async (transitionData) => {
  try {
    const response = await fetch(`/api/v1/workflows/${props.workflowUuid}/transitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transitionData)
    })
    
    if (response.ok) {
      await loadWorkflow()
      showAddTransitionDialog.value = false
      preSelectedTransitionSource.value = null
      preSelectedTransitionTarget.value = null
    }
  } catch (error) {
    console.error('Error adding transition:', error)
  }
}

const updateTransition = async (transitionData) => {
  try {
    const response = await fetch(`/api/v1/workflows/${props.workflowUuid}/transitions/${transitionData.uuid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transitionData)
    })
    
    if (response.ok) {
      await loadWorkflow()
    }
  } catch (error) {
    console.error('Error updating transition:', error)
  }
}

const deleteTransition = async (transitionUuid) => {
  try {
    const response = await fetch(`/api/v1/workflows/${props.workflowUuid}/transitions/${transitionUuid}`, {
      method: 'DELETE'
    })
    
    if (response.ok) {
      selectedElement.value = null
      panelOpen.value = false
      await loadWorkflow()
    }
  } catch (error) {
    console.error('Error deleting transition:', error)
  }
}

const saveWorkflow = async () => {
  saving.value = true
  try {
    const response = await fetch(`/api/v1/workflows/${props.workflowUuid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: workflow.value.name,
        description: workflow.value.description,
        entity_type: workflow.value.entity_type,
        is_active: workflow.value.is_active
      })
    })
    
    if (response.ok) {
      emit('saved')
    }
  } catch (error) {
    console.error('Error saving workflow:', error)
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadStatusCategories(),
    loadWorkflow()
  ])
})

// Watch for workflow UUID changes
watch(() => props.workflowUuid, () => {
  loadWorkflow()
})
</script>

<style scoped>
.workflow-editor {
  background: var(--p-surface-0);
}

:deep(.vue-flow) {
  background: var(--p-surface-100);
}

:deep(.vue-flow__minimap) {
  background: var(--p-surface-50);
  border: 1px solid var(--p-surface-200);
  border-radius: 8px;
}

:deep(.vue-flow__controls) {
  background: var(--p-surface-50);
  border: 1px solid var(--p-surface-200);
  border-radius: 8px;
}

:deep(.vue-flow__controls-button) {
  background: var(--p-surface-0);
  border: none;
}

:deep(.vue-flow__controls-button:hover) {
  background: var(--p-surface-100);
}

.side-panel {
  overflow: hidden;
}
</style>
