import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export const useWorkflowEditorStore = defineStore('workflowEditor', () => {
  // State
  const workflow = ref(null)
  const originalWorkflow = ref(null)
  const statusCategories = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const isDirty = ref(false)

  // Computed
  const statuses = computed(() => workflow.value?.statuses || [])
  const transitions = computed(() => workflow.value?.transitions || [])

  // Actions
  const loadWorkflow = async (workflowUuid, locale = 'en') => {
    if (!workflowUuid) {
      workflow.value = {
        name: '',
        description: '',
        entity_type: '',
        statuses: [],
        transitions: []
      }
      originalWorkflow.value = JSON.parse(JSON.stringify(workflow.value))
      isDirty.value = false
      return
    }

    loading.value = true
    try {
      const response = await fetch(`/api/v1/workflows/${workflowUuid}?locale=${locale}`)
      if (response.ok) {
        workflow.value = await response.json()
        originalWorkflow.value = JSON.parse(JSON.stringify(workflow.value))
        isDirty.value = false
      }
    } catch (error) {
      console.error('Error loading workflow:', error)
    } finally {
      loading.value = false
    }
  }

  const loadStatusCategories = async (locale = 'en') => {
    try {
      const response = await fetch(`/api/v1/workflow-status-categories?locale=${locale}`)
      if (response.ok) {
        statusCategories.value = await response.json()
      }
    } catch (error) {
      console.error('Error loading status categories:', error)
    }
  }

  // Status actions (local only)
  const addStatus = (statusData) => {
    const newStatus = {
      uuid: uuidv4(),
      name: statusData.name,
      rel_category_uuid: statusData.rel_category_uuid,
      category: statusCategories.value.find(c => c.uuid === statusData.rel_category_uuid),
      allow_all_inbound: statusData.allow_all_inbound || false,
      is_initial: statusData.is_initial || false,
      position_x: 100 + (workflow.value?.statuses?.length || 0) * 200,
      position_y: 100,
      _isNew: true
    }
    
    workflow.value.statuses.push(newStatus)
    isDirty.value = true
    return newStatus
  }

  const updateStatus = (statusData) => {
    const index = workflow.value.statuses.findIndex(s => s.uuid === statusData.uuid)
    if (index !== -1) {
      // Update category object if rel_category_uuid changed
      if (statusData.rel_category_uuid) {
        statusData.category = statusCategories.value.find(c => c.uuid === statusData.rel_category_uuid)
      }
      workflow.value.statuses[index] = { ...workflow.value.statuses[index], ...statusData }
      isDirty.value = true
    }
  }

  const updateStatusPosition = (statusUuid, x, y) => {
    const status = workflow.value.statuses.find(s => s.uuid === statusUuid)
    if (status) {
      status.position_x = x
      status.position_y = y
      isDirty.value = true
    }
  }

  const deleteStatus = (statusUuid) => {
    // Remove status
    workflow.value.statuses = workflow.value.statuses.filter(s => s.uuid !== statusUuid)
    
    // Remove transitions that reference this status
    workflow.value.transitions = workflow.value.transitions.filter(t => {
      // Remove if target is this status
      if (t.to_status?.uuid === statusUuid || t.rel_to_status_uuid === statusUuid) {
        return false
      }
      // Remove sources that reference this status
      if (t.sources) {
        t.sources = t.sources.filter(s => s.from_status?.uuid !== statusUuid && s.rel_from_status_uuid !== statusUuid)
        // If no sources left, remove the transition
        if (t.sources.length === 0) {
          return false
        }
      }
      return true
    })
    
    isDirty.value = true
  }

  // Transition actions (local only)
  const addTransition = (transitionData) => {
    const toStatus = workflow.value.statuses.find(s => s.uuid === transitionData.to_status_uuid)
    const sources = transitionData.source_status_uuids.map(uuid => {
      const fromStatus = workflow.value.statuses.find(s => s.uuid === uuid)
      return {
        uuid: uuidv4(),
        rel_from_status_uuid: uuid,
        from_status: fromStatus,
        _isNew: true
      }
    })

    const newTransition = {
      uuid: uuidv4(),
      name: transitionData.name,
      rel_to_status_uuid: transitionData.to_status_uuid,
      to_status: toStatus,
      sources,
      _isNew: true
    }
    
    workflow.value.transitions.push(newTransition)
    isDirty.value = true
    return newTransition
  }

  const updateTransition = (transitionData) => {
    const index = workflow.value.transitions.findIndex(t => t.uuid === transitionData.uuid)
    if (index !== -1) {
      workflow.value.transitions[index] = { ...workflow.value.transitions[index], ...transitionData }
      isDirty.value = true
    }
  }

  const deleteTransition = (transitionUuid) => {
    workflow.value.transitions = workflow.value.transitions.filter(t => t.uuid !== transitionUuid)
    isDirty.value = true
  }

  // Save all changes to backend
  const saveWorkflow = async () => {
    if (!workflow.value?.uuid) return false
    
    saving.value = true
    try {
      const response = await fetch(`/api/v1/workflows/${workflow.value.uuid}/save-all`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workflow.value.name,
          description: workflow.value.description,
          entity_type: workflow.value.entity_type,
          is_active: workflow.value.is_active,
          statuses: workflow.value.statuses.map(s => ({
            uuid: s._isNew ? null : s.uuid,
            tempUuid: s._isNew ? s.uuid : null,
            name: s.name,
            rel_category_uuid: s.rel_category_uuid,
            allow_all_inbound: s.allow_all_inbound,
            is_initial: s.is_initial,
            position_x: s.position_x,
            position_y: s.position_y
          })),
          transitions: workflow.value.transitions.map(t => ({
            uuid: t._isNew ? null : t.uuid,
            name: t.name,
            to_status_uuid: t._isNew ? t.rel_to_status_uuid : (t.to_status?.uuid || t.rel_to_status_uuid),
            source_status_uuids: t.sources.map(s => s._isNew ? s.rel_from_status_uuid : (s.from_status?.uuid || s.rel_from_status_uuid))
          }))
        })
      })
      
      if (response.ok) {
        const savedWorkflow = await response.json()
        workflow.value = savedWorkflow
        originalWorkflow.value = JSON.parse(JSON.stringify(savedWorkflow))
        isDirty.value = false
        return true
      }
      return false
    } catch (error) {
      console.error('Error saving workflow:', error)
      return false
    } finally {
      saving.value = false
    }
  }

  // Reset to original state
  const resetChanges = () => {
    if (originalWorkflow.value) {
      workflow.value = JSON.parse(JSON.stringify(originalWorkflow.value))
      isDirty.value = false
    }
  }

  // Clear store
  const clear = () => {
    workflow.value = null
    originalWorkflow.value = null
    isDirty.value = false
  }

  return {
    // State
    workflow,
    statusCategories,
    loading,
    saving,
    isDirty,
    
    // Computed
    statuses,
    transitions,
    
    // Actions
    loadWorkflow,
    loadStatusCategories,
    addStatus,
    updateStatus,
    updateStatusPosition,
    deleteStatus,
    addTransition,
    updateTransition,
    deleteTransition,
    saveWorkflow,
    resetChanges,
    clear
  }
})
