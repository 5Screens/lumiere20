/**
 * Languages Service
 * Handles API calls for language management
 */

import api from './api'

const BASE_URL = '/languages'

/**
 * Get all active languages for the language selector
 * @returns {Promise<Array>} List of active languages
 */
export async function getActiveLanguages() {
  const response = await api.get(`${BASE_URL}/active`)
  return response.data
}

/**
 * Get all languages (including inactive)
 * @returns {Promise<Array>} List of all languages
 */
export async function getAllLanguages() {
  const response = await api.get(BASE_URL)
  return response.data
}

export default {
  getActiveLanguages,
  getAllLanguages
}
