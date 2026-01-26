import api from './api'

const ENDPOINT = '/auth'

export default {
  /**
   * Login user
   * @param {Object} data - Login credentials (email, password)
   * @returns {Promise<Object>} - User and token
   */
  async login(data) {
    return api.post(`${ENDPOINT}/login`, data)
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} - User profile
   */
  async getProfile() {
    return api.get(`${ENDPOINT}/profile`)
  },

  /**
   * Logout
   * @returns {Promise<Object>}
   */
  async logout() {
    return api.post(`${ENDPOINT}/logout`)
  }
}
