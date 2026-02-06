import api from './api'

const BASE_URL = '/causes'

export default {
  /**
   * Search causes with PrimeVue filters
   */
  async search(params) {
    const response = await api.post(`${BASE_URL}/search`, params)
    return response.data
  },

  /**
   * Get all causes
   */
  async getAll(params = {}) {
    const response = await api.get(BASE_URL, { params })
    return response.data
  },

  /**
   * Get cause by UUID
   */
  async getByUuid(uuid) {
    const response = await api.get(`${BASE_URL}/${uuid}`)
    return response.data
  },

  /**
   * Create new cause
   */
  async create(data) {
    const response = await api.post(BASE_URL, data)
    return response.data
  },

  /**
   * Update cause
   */
  async update(uuid, data) {
    const response = await api.put(`${BASE_URL}/${uuid}`, data)
    return response.data
  },

  /**
   * Delete cause
   */
  async delete(uuid) {
    const response = await api.delete(`${BASE_URL}/${uuid}`)
    return response.data
  },

  /**
   * Delete multiple causes
   */
  async deleteMany(uuids) {
    const response = await api.post(`${BASE_URL}/delete-many`, { uuids })
    return response.data
  }
}
