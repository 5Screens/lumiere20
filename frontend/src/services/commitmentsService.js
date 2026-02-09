import api from './api'

const BASE_URL = '/commitments'

export default {
  /**
   * Search commitments with PrimeVue filters
   */
  async search(params) {
    const response = await api.post(`${BASE_URL}/search`, params)
    return response.data
  },

  /**
   * Get all commitments
   */
  async getAll(params = {}) {
    const response = await api.get(BASE_URL, { params })
    return response.data
  },

  /**
   * Get commitment by UUID
   */
  async getByUuid(uuid) {
    const response = await api.get(`${BASE_URL}/${uuid}`)
    return response.data
  },

  /**
   * Create new commitment
   */
  async create(data) {
    const response = await api.post(BASE_URL, data)
    return response.data
  },

  /**
   * Update commitment
   */
  async update(uuid, data) {
    const response = await api.put(`${BASE_URL}/${uuid}`, data)
    return response.data
  },

  /**
   * Delete commitment
   */
  async delete(uuid) {
    const response = await api.delete(`${BASE_URL}/${uuid}`)
    return response.data
  },

  /**
   * Delete multiple commitments
   */
  async deleteMany(uuids) {
    const response = await api.post(`${BASE_URL}/delete-many`, { uuids })
    return response.data
  }
}
