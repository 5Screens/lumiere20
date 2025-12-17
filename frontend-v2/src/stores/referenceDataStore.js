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
  const loading = ref({
    ciCategories: false,
    ciTypes: false
  })
  const loaded = ref({
    ciCategories: false,
    ciTypes: false
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
   * Invalidate all caches
   */
  const invalidateAll = () => {
    loaded.value.ciCategories = false
    loaded.value.ciTypes = false
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
    loading,
    loaded,
    // Getters
    getCiCategoryByUuid,
    getCiCategoryByCode,
    getCiTypeByUuid,
    getCiTypeByCode,
    getCiTypesByCategory,
    // Actions
    loadCiCategories,
    loadCiTypes,
    invalidateCiCategories,
    invalidateCiTypes,
    invalidateAll,
    reloadAll
  }
})
