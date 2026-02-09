import api from './api'

const BASE_URL = '/calendars'

export default {
  /**
   * Search calendars with PrimeVue filters
   */
  async search(params) {
    const response = await api.post(`${BASE_URL}/search`, params)
    return response.data
  },

  /**
   * Get all calendars
   */
  async getAll(params = {}) {
    const response = await api.get(BASE_URL, { params })
    return response.data
  },

  /**
   * Get calendar by UUID
   */
  async getByUuid(uuid) {
    const response = await api.get(`${BASE_URL}/${uuid}`)
    return response.data
  },

  /**
   * Create new calendar
   */
  async create(data) {
    const response = await api.post(BASE_URL, data)
    return response.data
  },

  /**
   * Update calendar
   */
  async update(uuid, data) {
    const response = await api.put(`${BASE_URL}/${uuid}`, data)
    return response.data
  },

  /**
   * Delete calendar
   */
  async delete(uuid) {
    const response = await api.delete(`${BASE_URL}/${uuid}`)
    return response.data
  },

  /**
   * Delete multiple calendars
   */
  async deleteMany(uuids) {
    const response = await api.post(`${BASE_URL}/delete-many`, { uuids })
    return response.data
  }
}
