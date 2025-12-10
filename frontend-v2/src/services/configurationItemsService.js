import api from './api'

const ENDPOINT = '/configuration_items'

export default {
  /**
   * Search configuration items with PrimeVue filters
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} - Search results
   */
  async search(params = {}) {
    // Deep clone to avoid Proxy serialization issues
    const payload = JSON.parse(JSON.stringify(params))
    console.log('[configurationItemsService] search payload:', payload)
    console.log('[configurationItemsService] payload.ciTypeUuid:', payload.ciTypeUuid)
    const response = await api.post(`${ENDPOINT}/search`, payload)
    return response.data
  },

  /**
   * Get all configuration items
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Paginated results
   */
  async getAll(params = {}) {
    const response = await api.get(ENDPOINT, { params })
    return response.data
  },

  /**
   * Get configuration item by UUID
   * @param {string} uuid - Item UUID
   * @returns {Promise<Object>} - Item data
   */
  async getByUuid(uuid) {
    const response = await api.get(`${ENDPOINT}/${uuid}`)
    return response.data
  },

  /**
   * Create new configuration item
   * @param {Object} data - Item data
   * @returns {Promise<Object>} - Created item
   */
  async create(data) {
    const response = await api.post(ENDPOINT, data)
    return response.data
  },

  /**
   * Update configuration item
   * @param {string} uuid - Item UUID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated item
   */
  async update(uuid, data) {
    const response = await api.put(`${ENDPOINT}/${uuid}`, data)
    return response.data
  },

  /**
   * Delete configuration item
   * @param {string} uuid - Item UUID
   * @returns {Promise<void>}
   */
  async delete(uuid) {
    await api.delete(`${ENDPOINT}/${uuid}`)
  },

  /**
   * Delete multiple configuration items
   * @param {string[]} uuids - Array of UUIDs
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteMany(uuids) {
    const response = await api.post(`${ENDPOINT}/delete-many`, { uuids })
    return response.data
  }
}
