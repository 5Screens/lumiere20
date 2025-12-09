import api from './api'

const BASE_URL = '/ci_categories'

export default {
  /**
   * Search CI categories with PrimeVue filters
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} - Search results
   */
  async search(params = {}) {
    const response = await api.post(`${BASE_URL}/search`, params)
    return response.data
  },

  /**
   * Get all CI categories
   * @param {boolean} activeOnly - If true, only return active categories
   */
  async getAll(activeOnly = true) {
    const response = await api.get(BASE_URL, {
      params: { active: activeOnly }
    })
    return response.data
  },

  /**
   * Get CI categories as select options
   */
  async getOptions() {
    const response = await api.get(`${BASE_URL}/options`)
    return response.data
  },

  /**
   * Get CI categories with their CI types
   */
  async getWithCiTypes() {
    const response = await api.get(`${BASE_URL}/with-ci-types`)
    return response.data
  },

  /**
   * Get uncategorized CI types
   */
  async getUncategorized() {
    const response = await api.get(`${BASE_URL}/uncategorized`)
    return response.data
  },

  /**
   * Get CI category by UUID
   * @param {string} uuid - CI category UUID
   */
  async getByUuid(uuid) {
    const response = await api.get(`${BASE_URL}/${uuid}`)
    return response.data
  },

  /**
   * Create a new CI category
   * @param {Object} data - CI category data
   */
  async create(data) {
    const response = await api.post(BASE_URL, data)
    return response.data
  },

  /**
   * Update a CI category
   * @param {string} uuid - CI category UUID
   * @param {Object} data - CI category data
   */
  async update(uuid, data) {
    const response = await api.put(`${BASE_URL}/${uuid}`, data)
    return response.data
  },

  /**
   * Delete a CI category
   * @param {string} uuid - CI category UUID
   */
  async delete(uuid) {
    await api.delete(`${BASE_URL}/${uuid}`)
  },

  /**
   * Delete multiple CI categories
   * @param {string[]} uuids - Array of UUIDs
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteMany(uuids) {
    const response = await api.post(`${BASE_URL}/delete-many`, { uuids })
    return response.data
  }
}
