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
  const objectSetupOptions = ref({}) // { 'incident:URGENCY': [...], 'incident:IMPACT': [...], ... }
  const loading = ref({
    ciCategories: false,
    ciTypes: false,
    workflowStatuses: {}, // { TASK: false, INCIDENT: false, ... }
    groups: false,
    objectSetupOptions: {} // { 'incident:URGENCY': false, ... }
  })
  const loaded = ref({
    ciCategories: false,
    ciTypes: false,
    workflowStatuses: {}, // { TASK: false, INCIDENT: false, ... }
    groups: false,
    objectSetupOptions: {} // { 'incident:URGENCY': false, ... }
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
   * Load object setup options for a specific object_type and metadata (with cache)
   * @param {string} objectType - Object type (e.g., 'incident', 'problem', 'change')
   * @param {string} metadata - Metadata type (e.g., 'URGENCY', 'IMPACT', 'CATEGORY')
   * @param {boolean} force - Force reload even if already loaded
   * @returns {Promise<Array>} Options array with { label, value, icon, color }
   */
  const loadObjectSetupOptions = async (objectType, metadata, force = false) => {
    if (!objectType || !metadata) {
      console.warn('[ReferenceDataStore] loadObjectSetupOptions called without objectType or metadata')
      return []
    }

    const cacheKey = `${objectType}:${metadata}`

    if (loaded.value.objectSetupOptions[cacheKey] && !force) {
      return objectSetupOptions.value[cacheKey] || []
    }

    if (loading.value.objectSetupOptions[cacheKey]) {
      return new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (!loading.value.objectSetupOptions[cacheKey]) {
            clearInterval(checkLoaded)
            resolve(objectSetupOptions.value[cacheKey] || [])
          }
        }, 50)
      })
    }

    loading.value.objectSetupOptions[cacheKey] = true
    try {
      const response = await api.get('/object-setup/options', {
        params: { object_type: objectType, metadata: metadata }
      })
      objectSetupOptions.value[cacheKey] = response.data || []
      loaded.value.objectSetupOptions[cacheKey] = true
      return objectSetupOptions.value[cacheKey]
    } catch (error) {
      console.error(`[ReferenceDataStore] Failed to load object setup options for ${cacheKey}:`, error)
      objectSetupOptions.value[cacheKey] = []
      return []
    } finally {
      loading.value.objectSetupOptions[cacheKey] = false
    }
  }

  /**
   * Get cached object setup options (sync, returns empty array if not loaded)
   * @param {string} objectType - Object type
   * @param {string} metadata - Metadata type
   * @returns {Array} Cached options or empty array
   */
  const getObjectSetupOptions = (objectType, metadata) => {
    const cacheKey = `${objectType}:${metadata}`
    return objectSetupOptions.value[cacheKey] || []
  }

  /**
   * Parse options_source endpoint and load options
   * @param {string} optionsSource - API endpoint like '/object-setup/options?object_type=incident&metadata=URGENCY'
   * @param {boolean} force - Force reload
   * @returns {Promise<Array>} Options array
   */
  const loadOptionsFromSource = async (optionsSource, force = false) => {
    if (!optionsSource || typeof optionsSource !== 'string') return []
    
    // Parse the endpoint to extract object_type and metadata
    const match = optionsSource.match(/object-setup\/options\?object_type=([^&]+)&metadata=([^&]+)/)
    if (match) {
      const [, objectType, metadata] = match
      return await loadObjectSetupOptions(objectType, metadata, force)
    }
    
    // Not an object-setup endpoint, return empty (caller should handle other endpoints)
    return null
  }

  /**
   * Invalidate object setup options cache
   * @param {string} objectType - Optional object type to invalidate
   * @param {string} metadata - Optional metadata to invalidate
   */
  const invalidateObjectSetupOptions = (objectType = null, metadata = null) => {
    if (objectType && metadata) {
      const cacheKey = `${objectType}:${metadata}`
      loaded.value.objectSetupOptions[cacheKey] = false
    } else {
      loaded.value.objectSetupOptions = {}
      objectSetupOptions.value = {}
    }
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
    objectSetupOptions,
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
    getObjectSetupOptions,
    // Actions
    loadCiCategories,
    loadCiTypes,
    loadWorkflowStatuses,
    loadGroups,
    loadObjectSetupOptions,
    loadOptionsFromSource,
    invalidateCiCategories,
    invalidateCiTypes,
    invalidateWorkflowStatuses,
    invalidateGroups,
    invalidateObjectSetupOptions,
    invalidateAll,
    reloadAll
  }
})
