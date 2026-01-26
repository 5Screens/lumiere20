import api from './api'

const BASE_URL = '/audit'

export default {
  /**
   * Search audit changes with PrimeVue filters
   */
  async search(params) {
    const response = await api.post(`${BASE_URL}/search`, params)
    return response.data
  },

  /**
   * Get all audit changes with pagination
   */
  async getAll(params = {}) {
    const response = await api.get(BASE_URL, { params })
    return response.data
  },

  /**
   * Get audit changes for a specific object
   */
  async getByObjectUuid(objectUuid) {
    const response = await api.get(`${BASE_URL}/object/${objectUuid}`)
    return response.data
  }
}
