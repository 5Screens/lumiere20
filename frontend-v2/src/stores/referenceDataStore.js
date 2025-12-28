import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

/**
 * Store for reference data (CI categories, CI types, etc.)
 * These are data that:
 * - Change rarely
 * - Are used across many components
 * - Should be cached to avoid repeated API calls
 */
export const useReferenceDataStore = defineStore('referenceData', () => {
  // State
  const ciCategories = ref([])
  const ciTypes = ref([])
  const workflowStatusesByTicketType = ref({}) // { TASK: [...], INCIDENT: [...], ... }
  const groups = ref([])
  const loading = ref({
    ciCategories: false,
    ciTypes: false,
    workflowStatuses: {}, // { TASK: false, INCIDENT: false, ... }
    groups: false
  })
  const loaded = ref({
    ciCategories: false,
    ciTypes: false,
    workflowStatuses: {}, // { TASK: false, INCIDENT: false, ... }
    groups: false
  })

  // Getters
  const getCiCategoryByUuid = computed(() => {
    return (uuid) => ciCategories.value.find(c => c.uuid === uuid)
  })

  const getCiCategoryByCode = computed(() => {
    return (code) => ciCategories.value.find(c => c.code === code)
  })

  const getCiTypeByUuid = computed(() => {
    return (uuid) => ciTypes.value.find(t => t.uuid === uuid)
  })

  const getCiTypeByCode = computed(() => {
    return (code) => ciTypes.value.find(t => t.code === code)
  })

  const getCiTypesByCategory = computed(() => {
    return (categoryCode) => ciTypes.value.filter(t => t.category?.code === categoryCode)
  })

  const getWorkflowStatusesByTicketType = computed(() => {
    return (ticketTypeCode) => workflowStatusesByTicketType.value[ticketTypeCode] || []
  })

  const getGroupByUuid = computed(() => {
    return (uuid) => groups.value.find(g => g.uuid === uuid)
  })

  // Actions

  /**
   * Load CI categories from API (with cache)
   * @param {boolean} force - Force reload even if already loaded
   */
  const loadCiCategories = async (force = false) => {
    if (loaded.value.ciCategories && !force) {
      return ciCategories.value
    }

    if (loading.value.ciCategories) {
      // Already loading, wait for it
      return new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (!loading.value.ciCategories) {
            clearInterval(checkLoaded)
            resolve(ciCategories.value)
          }
        }, 50)
      })
    }

    loading.value.ciCategories = true
    try {
      const response = await api.get('/ci_categories')
      ciCategories.value = response.data
      loaded.value.ciCategories = true
      return ciCategories.value
    } catch (error) {
      console.error('[ReferenceDataStore] Failed to load CI categories:', error)
      throw error
    } finally {
      loading.value.ciCategories = false
    }
  }

  /**
   * Load CI types from API (with cache)
   * @param {boolean} force - Force reload even if already loaded
   */
  const loadCiTypes = async (force = false) => {
    if (loaded.value.ciTypes && !force) {
      return ciTypes.value
    }

    if (loading.value.ciTypes) {
      // Already loading, wait for it
      return new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (!loading.value.ciTypes) {
            clearInterval(checkLoaded)
            resolve(ciTypes.value)
          }
        }, 50)
      })
    }

    loading.value.ciTypes = true
    try {
      const response = await api.get('/ci_types')
      // Map to include useful computed properties
      ciTypes.value = response.data.map(ct => ({
        ...ct,
        categoryCode: ct.category?.code || null
      }))
      loaded.value.ciTypes = true
      return ciTypes.value
    } catch (error) {
      console.error('[ReferenceDataStore] Failed to load CI types:', error)
      throw error
    } finally {
      loading.value.ciTypes = false
    }
  }

  /**
   * Load workflow statuses for a specific ticket type (with cache)
   * @param {string} ticketTypeCode - Ticket type code (e.g., 'TASK', 'INCIDENT', 'PROBLEM')
   * @param {boolean} force - Force reload even if already loaded
   */
  const loadWorkflowStatuses = async (ticketTypeCode, force = false) => {
    if (!ticketTypeCode) {
      console.warn('[ReferenceDataStore] loadWorkflowStatuses called without ticketTypeCode')
      return []
    }

    if (loaded.value.workflowStatuses[ticketTypeCode] && !force) {
      return workflowStatusesByTicketType.value[ticketTypeCode] || []
    }

    if (loading.value.workflowStatuses[ticketTypeCode]) {
      return new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (!loading.value.workflowStatuses[ticketTypeCode]) {
            clearInterval(checkLoaded)
            resolve(workflowStatusesByTicketType.value[ticketTypeCode] || [])
          }
        }, 50)
      })
    }

    loading.value.workflowStatuses[ticketTypeCode] = true
    try {
      const response = await api.get(`/workflows/ticket-type/${ticketTypeCode}/statuses`)
      workflowStatusesByTicketType.value[ticketTypeCode] = response.data || []
      loaded.value.workflowStatuses[ticketTypeCode] = true
      return workflowStatusesByTicketType.value[ticketTypeCode]
    } catch (error) {
      console.error(`[ReferenceDataStore] Failed to load workflow statuses for ${ticketTypeCode}:`, error)
      workflowStatusesByTicketType.value[ticketTypeCode] = []
      return []
    } finally {
      loading.value.workflowStatuses[ticketTypeCode] = false
    }
  }

  /**
   * Load groups from API (with cache)
   * @param {boolean} force - Force reload even if already loaded
   */
  const loadGroups = async (force = false) => {
    if (loaded.value.groups && !force) {
      return groups.value
    }

    if (loading.value.groups) {
      return new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (!loading.value.groups) {
            clearInterval(checkLoaded)
            resolve(groups.value)
          }
        }, 50)
      })
    }

    loading.value.groups = true
    try {
      // Load all groups (no pagination limit for reference data)
      const response = await api.get('/groups', { params: { limit: 1000 } })
      const payload = response?.data
      if (Array.isArray(payload)) {
        groups.value = payload
      } else if (Array.isArray(payload?.data)) {
        groups.value = payload.data
      } else {
        groups.value = []
      }
      loaded.value.groups = true
      return groups.value
    } catch (error) {
      console.error('[ReferenceDataStore] Failed to load groups:', error)
      groups.value = []
      return []
    } finally {
      loading.value.groups = false
    }
  }

  /**
   * Invalidate CI categories cache (call after CRUD operations)
   */
  const invalidateCiCategories = () => {
    loaded.value.ciCategories = false
  }

  /**
   * Invalidate CI types cache (call after CRUD operations)
   */
  const invalidateCiTypes = () => {
    loaded.value.ciTypes = false
  }

  /**
   * Invalidate workflow statuses cache for a specific ticket type or all
   * @param {string} ticketTypeCode - Optional ticket type code to invalidate
   */
  const invalidateWorkflowStatuses = (ticketTypeCode = null) => {
    if (ticketTypeCode) {
      loaded.value.workflowStatuses[ticketTypeCode] = false
    } else {
      loaded.value.workflowStatuses = {}
      workflowStatusesByTicketType.value = {}
    }
  }

  /**
   * Invalidate groups cache
   */
  const invalidateGroups = () => {
    loaded.value.groups = false
  }

  /**
   * Invalidate all caches
   */
  const invalidateAll = () => {
    loaded.value.ciCategories = false
    loaded.value.ciTypes = false
    loaded.value.workflowStatuses = false
    loaded.value.groups = false
  }

  /**
   * Force reload all reference data
   */
  const reloadAll = async () => {
    invalidateAll()
    await Promise.all([
      loadCiCategories(true),
      loadCiTypes(true)
    ])
  }

  return {
    // State
    ciCategories,
    ciTypes,
    workflowStatusesByTicketType,
    groups,
    loading,
    loaded,
    // Getters
    getCiCategoryByUuid,
    getCiCategoryByCode,
    getCiTypeByUuid,
    getCiTypeByCode,
    getCiTypesByCategory,
    getWorkflowStatusesByTicketType,
    getGroupByUuid,
    // Actions
    loadCiCategories,
    loadCiTypes,
    loadWorkflowStatuses,
    loadGroups,
    invalidateCiCategories,
    invalidateCiTypes,
    invalidateWorkflowStatuses,
    invalidateGroups,
    invalidateAll,
    reloadAll
  }
})
