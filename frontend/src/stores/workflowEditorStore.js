import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import api from '@/services/api'

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
      const response = await api.get(`/workflows/${workflowUuid}`, {
        params: { locale }
      })
      workflow.value = response.data
      originalWorkflow.value = JSON.parse(JSON.stringify(workflow.value))
      isDirty.value = false
    } catch (error) {
      console.error('Error loading workflow:', error)
    } finally {
      loading.value = false
    }
  }

  const loadStatusCategories = async (locale = 'en') => {
    try {
      const response = await api.get('/workflow-status-categories', {
        params: { locale }
      })
      statusCategories.value = response.data
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
      // If setting this status as initial, unset all other statuses
      if (statusData.is_initial) {
        workflow.value.statuses.forEach(s => {
          if (s.uuid !== statusData.uuid) {
            s.is_initial = false
          }
        })
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
    // Support both formats: sources (from dialog) and source_status_uuids (from API)
    const sourceUuids = transitionData.sources || transitionData.source_status_uuids || []
    const toStatusUuid = transitionData.rel_to_status_uuid || transitionData.to_status_uuid
    
    const toStatus = workflow.value.statuses.find(s => s.uuid === toStatusUuid)
    const sources = sourceUuids.map(uuid => {
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
      rel_to_status_uuid: toStatusUuid,
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

  // ============================================
  // WORKFLOW ACTIONS
  // ============================================

  /**
   * Add an action to a status or transition
   * @param {Object} actionData - { trigger, action_type, label, config, rel_status_uuid?, rel_transition_uuid? }
   */
  const addAction = (actionData) => {
    const { trigger, rel_status_uuid, rel_transition_uuid } = actionData

    // Determine the current actions list to calculate sort_order
    let currentActions = []
    if (rel_status_uuid) {
      const status = workflow.value.statuses.find(s => s.uuid === rel_status_uuid)
      if (status) {
        const key = trigger === 'on_enter' ? 'on_enter_actions' : 'on_exit_actions'
        if (!status[key]) status[key] = []
        currentActions = status[key]
      }
    } else if (rel_transition_uuid) {
      const transition = workflow.value.transitions.find(t => t.uuid === rel_transition_uuid)
      if (transition) {
        if (!transition.actions) transition.actions = []
        currentActions = transition.actions
      }
    }

    const newAction = {
      uuid: uuidv4(),
      rel_workflow_uuid: workflow.value.uuid,
      rel_status_uuid: rel_status_uuid || null,
      rel_transition_uuid: rel_transition_uuid || null,
      trigger: trigger,
      action_type: actionData.action_type,
      label: actionData.label || '',
      config: actionData.config || {},
      sort_order: currentActions.length,
      is_active: true,
      _isNew: true
    }

    currentActions.push(newAction)
    isDirty.value = true
    return newAction
  }

  /**
   * Update an existing action
   */
  const updateAction = (actionUuid, actionData) => {
    // Search in all statuses and transitions
    for (const status of workflow.value.statuses) {
      for (const key of ['on_enter_actions', 'on_exit_actions']) {
        const list = status[key] || []
        const idx = list.findIndex(a => a.uuid === actionUuid)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...actionData }
          isDirty.value = true
          return
        }
      }
    }
    for (const transition of workflow.value.transitions) {
      const list = transition.actions || []
      const idx = list.findIndex(a => a.uuid === actionUuid)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...actionData }
        isDirty.value = true
        return
      }
    }
  }

  /**
   * Delete an action by UUID
   */
  const deleteAction = (actionUuid) => {
    for (const status of workflow.value.statuses) {
      for (const key of ['on_enter_actions', 'on_exit_actions']) {
        if (!status[key]) continue
        const idx = status[key].findIndex(a => a.uuid === actionUuid)
        if (idx !== -1) {
          status[key].splice(idx, 1)
          // Re-index sort_order
          status[key].forEach((a, i) => { a.sort_order = i })
          isDirty.value = true
          return
        }
      }
    }
    for (const transition of workflow.value.transitions) {
      if (!transition.actions) continue
      const idx = transition.actions.findIndex(a => a.uuid === actionUuid)
      if (idx !== -1) {
        transition.actions.splice(idx, 1)
        transition.actions.forEach((a, i) => { a.sort_order = i })
        isDirty.value = true
        return
      }
    }
  }

  /**
   * Reorder actions within a list (after drag & drop)
   * @param {string} ownerUuid - status or transition UUID
   * @param {string} trigger - 'on_enter', 'on_exit', or 'on_transition'
   * @param {Array} orderedUuids - new order of action UUIDs
   */
  const reorderActions = (ownerUuid, trigger, orderedUuids) => {
    let list = null

    if (trigger === 'on_enter' || trigger === 'on_exit') {
      const status = workflow.value.statuses.find(s => s.uuid === ownerUuid)
      if (status) {
        const key = trigger === 'on_enter' ? 'on_enter_actions' : 'on_exit_actions'
        list = status[key]
      }
    } else {
      const transition = workflow.value.transitions.find(t => t.uuid === ownerUuid)
      if (transition) list = transition.actions
    }

    if (list) {
      const reordered = orderedUuids.map((uuid, i) => {
        const action = list.find(a => a.uuid === uuid)
        if (action) action.sort_order = i
        return action
      }).filter(Boolean)
      // Replace in-place
      list.length = 0
      list.push(...reordered)
      isDirty.value = true
    }
  }

  /**
   * Collect all actions from statuses and transitions for the save payload
   */
  const collectAllActions = () => {
    const allActions = []
    for (const status of (workflow.value?.statuses || [])) {
      for (const action of (status.on_enter_actions || [])) {
        allActions.push({ ...action, rel_status_uuid: status.uuid, rel_transition_uuid: null })
      }
      for (const action of (status.on_exit_actions || [])) {
        allActions.push({ ...action, rel_status_uuid: status.uuid, rel_transition_uuid: null })
      }
    }
    for (const transition of (workflow.value?.transitions || [])) {
      for (const action of (transition.actions || [])) {
        allActions.push({ ...action, rel_status_uuid: null, rel_transition_uuid: transition.uuid })
      }
    }
    return allActions
  }

  // Save all changes to backend
  const saveWorkflow = async () => {
    if (!workflow.value?.uuid) return false
    
    saving.value = true
    try {
      const response = await api.put(`/workflows/${workflow.value.uuid}/save-all`, {
        name: workflow.value.name,
        description: workflow.value.description,
        entity_type: workflow.value.entity_type,
        is_active: workflow.value.is_active,
        statuses: workflow.value.statuses.map(s => ({
          uuid: s._isNew ? null : s.uuid,
          tempUuid: s._isNew ? s.uuid : null,
          _isNew: s._isNew,
          name: s.name,
          rel_category_uuid: s.rel_category_uuid,
          allow_all_inbound: s.allow_all_inbound,
          is_initial: s.is_initial,
          position_x: s.position_x,
          position_y: s.position_y,
          _translations: s._translations
        })),
        transitions: workflow.value.transitions.map(t => ({
          uuid: t._isNew ? null : t.uuid,
          _isNew: t._isNew,
          name: t.name,
          to_status_uuid: t._isNew ? t.rel_to_status_uuid : (t.to_status?.uuid || t.rel_to_status_uuid),
          source_status_uuids: t.sources.map(s => s._isNew ? s.rel_from_status_uuid : (s.from_status?.uuid || s.rel_from_status_uuid)),
          _translations: t._translations
        })),
        actions: collectAllActions().map(a => ({
          rel_status_uuid: a.rel_status_uuid,
          rel_transition_uuid: a.rel_transition_uuid,
          trigger: a.trigger,
          action_type: a.action_type,
          label: a.label || null,
          config: a.config || {},
          sort_order: a.sort_order || 0,
          is_active: a.is_active !== undefined ? a.is_active : true
        }))
      })
      
      workflow.value = response.data
      originalWorkflow.value = JSON.parse(JSON.stringify(response.data))
      isDirty.value = false
      return true
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
    addAction,
    updateAction,
    deleteAction,
    reorderActions,
    saveWorkflow,
    resetChanges,
    clear
  }
})
