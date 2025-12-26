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
      console.log(`[MetadataService] Cache hit for objectType: ${code}`)
      return cache.get(cacheKey)
    }
    
    console.log(`[MetadataService] Fetching objectType: ${code} from API`)
    try {
      const response = await api.get(`${BASE_URL}/${code}`)
      console.log(`[MetadataService] Successfully loaded objectType: ${code}`, response.data ? 'with data' : 'empty')
      cache.set(cacheKey, response.data)
      return response.data
    } catch (error) {
      console.error(`[MetadataService] Failed to fetch objectType: ${code}`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: `${BASE_URL}/${code}`
      })
      throw error
    }
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
   * Parse options_source - can be JSON string or API endpoint
   * @param {string} optionsSource - JSON string of options or API endpoint
   * @returns {Array|string} Parsed options array or API endpoint string
   */
  parseOptions(optionsSource) {
    if (!optionsSource) return []
    
    // If it starts with '/', it's an API endpoint
    if (optionsSource.startsWith('/')) {
      return optionsSource
    }
    
    // Otherwise, try to parse as JSON
    try {
      return JSON.parse(optionsSource)
    } catch {
      return []
    }
  },

  /**
   * Check if options_source is an API endpoint
   * @param {string} optionsSource - Options source string
   * @returns {boolean}
   */
  isApiEndpoint(optionsSource) {
    return optionsSource && optionsSource.startsWith('/')
  },

  /**
   * Fetch options from an API endpoint
   * @param {string} endpoint - API endpoint path
   * @param {boolean} useCache - Use cached data if available
   * @returns {Promise<Array>} Options array
   */
  async fetchOptions(endpoint, useCache = true) {
    const cacheKey = `options:${endpoint}`
    
    if (useCache && cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }
    
    try {
      const response = await api.get(endpoint)
      const options = response.data
      cache.set(cacheKey, options)
      return options
    } catch (error) {
      console.error(`Failed to fetch options from ${endpoint}:`, error)
      return []
    }
  },

  /**
   * Get options for a field - handles both static JSON and API endpoints
   * @param {Object} field - Field metadata object
   * @param {boolean} useCache - Use cached data if available
   * @returns {Promise<Array>} Options array
   */
  async getFieldOptions(field, useCache = true) {
    if (!field.options_source) return []
    
    if (this.isApiEndpoint(field.options_source)) {
      return await this.fetchOptions(field.options_source, useCache)
    }
    
    return this.parseOptions(field.options_source)
  }
}
