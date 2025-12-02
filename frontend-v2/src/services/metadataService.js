import api from './api'

const BASE_URL = '/metadata'

// Cache for metadata to avoid repeated API calls
const cache = new Map()

export default {
  /**
   * Get object type metadata with all fields
   * @param {string} code - Object type code
   * @param {boolean} useCache - Use cached data if available
   */
  async getObjectType(code, useCache = true) {
    const cacheKey = `objectType:${code}`
    
    if (useCache && cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }
    
    const response = await api.get(`${BASE_URL}/${code}`)
    cache.set(cacheKey, response.data)
    return response.data
  },

  /**
   * Get all active object types
   */
  async getAllObjectTypes() {
    const response = await api.get(BASE_URL)
    return response.data
  },

  /**
   * Get table columns for an object type
   * @param {string} code - Object type code
   * @param {boolean} useCache - Use cached data if available
   */
  async getTableColumns(code, useCache = true) {
    const cacheKey = `columns:${code}`
    
    if (useCache && cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }
    
    const response = await api.get(`${BASE_URL}/${code}/columns`)
    cache.set(cacheKey, response.data)
    return response.data
  },

  /**
   * Get form fields for an object type
   * @param {string} code - Object type code
   * @param {boolean} useCache - Use cached data if available
   */
  async getFormFields(code, useCache = true) {
    const cacheKey = `formFields:${code}`
    
    if (useCache && cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }
    
    const response = await api.get(`${BASE_URL}/${code}/form-fields`)
    cache.set(cacheKey, response.data)
    return response.data
  },

  /**
   * Clear cache for a specific object type or all
   * @param {string} code - Object type code (optional)
   */
  clearCache(code = null) {
    if (code) {
      cache.delete(`objectType:${code}`)
      cache.delete(`columns:${code}`)
      cache.delete(`formFields:${code}`)
    } else {
      cache.clear()
    }
  },

  /**
   * Parse options_source JSON string to array
   * @param {string} optionsSource - JSON string of options
   */
  parseOptions(optionsSource) {
    if (!optionsSource) return []
    try {
      return JSON.parse(optionsSource)
    } catch {
      return []
    }
  }
}
