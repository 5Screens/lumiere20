import api from './api'

const ENDPOINT = '/auth'

export default {
  /**
   * Register a new user
   * @param {Object} data - Registration data
   * @returns {Promise<Object>} - Created user
   */
  async register(data) {
    const response = await api.post(`${ENDPOINT}/register`, data)
    return response.data
  },

  /**
   * Login user
   * @param {Object} data - Login credentials
   * @returns {Promise<Object>} - User and token
   */
  async login(data) {
    const response = await api.post(`${ENDPOINT}/login`, data)
    return response.data
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} - User profile
   */
  async getProfile() {
    const response = await api.get(`${ENDPOINT}/profile`)
    return response.data
  },

  /**
   * Update user profile
   * @param {Object} data - Profile data
   * @returns {Promise<Object>} - Updated profile
   */
  async updateProfile(data) {
    const response = await api.put(`${ENDPOINT}/profile`, data)
    return response.data
  },

  /**
   * Change password
   * @param {Object} data - Password data
   * @returns {Promise<Object>}
   */
  async changePassword(data) {
    const response = await api.post(`${ENDPOINT}/change-password`, data)
    return response.data
  },

  /**
   * Logout
   * @returns {Promise<Object>}
   */
  async logout() {
    const response = await api.post(`${ENDPOINT}/logout`)
    return response.data
  }
}
