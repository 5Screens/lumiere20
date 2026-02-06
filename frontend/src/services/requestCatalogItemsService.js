import api from './api'

const BASE_URL = '/request-catalog-items'

export default {
  /**
   * Search request catalog items with PrimeVue filters
   */
  async search(params) {
    const response = await api.post(`${BASE_URL}/search`, params)
    return response.data
  },

  /**
   * Get all request catalog items
   */
  async getAll(params = {}) {
    const response = await api.get(BASE_URL, { params })
    return response.data
  },

  /**
   * Get request catalog item by UUID
   */
  async getByUuid(uuid) {
    const response = await api.get(`${BASE_URL}/${uuid}`)
    return response.data
  },

  /**
   * Create new request catalog item
   */
  async create(data) {
    const response = await api.post(BASE_URL, data)
    return response.data
  },

  /**
   * Update request catalog item
   */
  async update(uuid, data) {
    const response = await api.put(`${BASE_URL}/${uuid}`, data)
    return response.data
  },

  /**
   * Delete request catalog item
   */
  async delete(uuid) {
    const response = await api.delete(`${BASE_URL}/${uuid}`)
    return response.data
  },

  /**
   * Delete multiple request catalog items
   */
  async deleteMany(uuids) {
    const response = await api.post(`${BASE_URL}/delete-many`, { uuids })
    return response.data
  }
}
