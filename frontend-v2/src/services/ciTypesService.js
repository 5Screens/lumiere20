import api from './api'

const BASE_URL = '/ci_types'

export default {
  /**
   * Search CI types with PrimeVue filters
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} - Search results
   */
  async search(params = {}) {
    const response = await api.post(`${BASE_URL}/search`, params)
    return response.data
  },

  /**
   * Get all CI types
   * @param {boolean} activeOnly - If true, only return active types
   */
  async getAll(activeOnly = true) {
    const response = await api.get(BASE_URL, {
      params: { active: activeOnly }
    })
    return response.data
  },

  /**
   * Get CI types as select options
   */
  async getOptions() {
    const response = await api.get(`${BASE_URL}/options`)
    return response.data
  },

  /**
   * Get CI type by code
   * @param {string} code - CI type code
   */
  async getByCode(code) {
    const response = await api.get(`${BASE_URL}/${code}`)
    return response.data
  },

  /**
   * Create a new CI type
   * @param {Object} data - CI type data
   */
  async create(data) {
    const response = await api.post(BASE_URL, data)
    return response.data
  },

  /**
   * Update a CI type
   * @param {string} uuid - CI type UUID
   * @param {Object} data - CI type data
   */
  async update(uuid, data) {
    const response = await api.put(`${BASE_URL}/${uuid}`, data)
    return response.data
  },

  /**
   * Delete a CI type
   * @param {string} uuid - CI type UUID
   */
  async delete(uuid) {
    await api.delete(`${BASE_URL}/${uuid}`)
  },

  /**
   * Delete multiple CI types
   * @param {string[]} uuids - Array of UUIDs
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteMany(uuids) {
    const response = await api.post(`${BASE_URL}/delete-many`, { uuids })
    return response.data
  }
}
