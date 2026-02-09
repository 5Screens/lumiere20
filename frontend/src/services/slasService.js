import api from './api'

const BASE_URL = '/slas'

export default {
  /**
   * Search SLAs with PrimeVue filters
   */
  async search(params) {
    const response = await api.post(`${BASE_URL}/search`, params)
    return response.data
  },

  /**
   * Get all SLAs
   */
  async getAll(params = {}) {
    const response = await api.get(BASE_URL, { params })
    return response.data
  },

  /**
   * Get SLA by UUID
   */
  async getByUuid(uuid) {
    const response = await api.get(`${BASE_URL}/${uuid}`)
    return response.data
  },

  /**
   * Create new SLA
   */
  async create(data) {
    const response = await api.post(BASE_URL, data)
    return response.data
  },

  /**
   * Update SLA
   */
  async update(uuid, data) {
    const response = await api.put(`${BASE_URL}/${uuid}`, data)
    return response.data
  },

  /**
   * Delete SLA
   */
  async delete(uuid) {
    const response = await api.delete(`${BASE_URL}/${uuid}`)
    return response.data
  },

  /**
   * Delete multiple SLAs
   */
  async deleteMany(uuids) {
    const response = await api.post(`${BASE_URL}/delete-many`, { uuids })
    return response.data
  }
}
