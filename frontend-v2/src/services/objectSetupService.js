import api from './api'

const BASE_URL = '/object-setup'

export default {
  /**
   * Search object setup records with PrimeVue filters
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} - Search results
   */
  async search(params = {}) {
    const response = await api.post(`${BASE_URL}/search`, params)
    return response.data
  },

  /**
   * Get all object setup records
   * @param {boolean} activeOnly - If true, only return active records
   * @param {string} objectType - Optional filter by object_type
   */
  async getAll(activeOnly = true, objectType = null) {
    const params = { active: activeOnly }
    if (objectType) {
      params.object_type = objectType
    }
    const response = await api.get(BASE_URL, { params })
    return response.data
  },

  /**
   * Get object setup records as select options
   * @param {string} objectType - Object type (e.g., 'entity', 'incident')
   * @param {string} metadata - Metadata type (e.g., 'CATEGORY', 'URGENCY')
   */
  async getOptions(objectType, metadata) {
    const response = await api.get(`${BASE_URL}/options`, {
      params: { object_type: objectType, metadata }
    })
    return response.data
  },

  /**
   * Get distinct object types
   */
  async getObjectTypes() {
    const response = await api.get(`${BASE_URL}/object-types`)
    return response.data
  },

  /**
   * Get distinct metadata types for a given object_type
   * @param {string} objectType - Object type
   */
  async getMetadataTypes(objectType) {
    const response = await api.get(`${BASE_URL}/metadata-types`, {
      params: { object_type: objectType }
    })
    return response.data
  },

  /**
   * Get object setup by UUID
   * @param {string} uuid - Object setup UUID
   */
  async getByUuid(uuid) {
    const response = await api.get(`${BASE_URL}/${uuid}`)
    return response.data
  },

  /**
   * Create a new object setup record
   * @param {Object} data - Object setup data
   */
  async create(data) {
    const response = await api.post(BASE_URL, data)
    return response.data
  },

  /**
   * Update an object setup record
   * @param {string} uuid - Object setup UUID
   * @param {Object} data - Object setup data
   */
  async update(uuid, data) {
    const response = await api.put(`${BASE_URL}/${uuid}`, data)
    return response.data
  },

  /**
   * Delete an object setup record
   * @param {string} uuid - Object setup UUID
   */
  async delete(uuid) {
    await api.delete(`${BASE_URL}/${uuid}`)
  }
}
