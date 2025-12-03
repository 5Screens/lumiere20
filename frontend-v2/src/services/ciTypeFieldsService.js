import api from './api'

const BASE_URL = '/ci_type_fields'

export default {
  /**
   * Get all fields for a CI type
   * @param {string} ciTypeUuid - CI type UUID
   * @returns {Promise<Array>} List of fields
   */
  async getByTypeUuid(ciTypeUuid) {
    const response = await api.get(`${BASE_URL}/type/${ciTypeUuid}`)
    return response.data
  },

  /**
   * Get a single field by UUID
   * @param {string} uuid - Field UUID
   * @returns {Promise<Object>} Field
   */
  async getByUuid(uuid) {
    const response = await api.get(`${BASE_URL}/${uuid}`)
    return response.data
  },

  /**
   * Create a new field
   * @param {Object} data - Field data
   * @returns {Promise<Object>} Created field
   */
  async create(data) {
    const response = await api.post(BASE_URL, data)
    return response.data
  },

  /**
   * Update a field
   * @param {string} uuid - Field UUID
   * @param {Object} data - Field data
   * @returns {Promise<Object>} Updated field
   */
  async update(uuid, data) {
    const response = await api.put(`${BASE_URL}/${uuid}`, data)
    return response.data
  },

  /**
   * Delete a field
   * @param {string} uuid - Field UUID
   */
  async delete(uuid) {
    await api.delete(`${BASE_URL}/${uuid}`)
  },

  /**
   * Delete multiple fields
   * @param {string[]} uuids - Array of UUIDs
   * @returns {Promise<Object>} Deletion result
   */
  async deleteMany(uuids) {
    const response = await api.post(`${BASE_URL}/delete-many`, { uuids })
    return response.data
  },

  /**
   * Reorder fields
   * @param {string} ciTypeUuid - CI type UUID
   * @param {string[]} orderedUuids - Array of field UUIDs in new order
   */
  async reorder(ciTypeUuid, orderedUuids) {
    const response = await api.post(`${BASE_URL}/type/${ciTypeUuid}/reorder`, { orderedUuids })
    return response.data
  },

  /**
   * Toggle field visibility
   * @param {string} uuid - Field UUID
   * @param {string} property - Property to toggle (show_in_form or show_in_table)
   * @returns {Promise<Object>} Updated field
   */
  async toggleVisibility(uuid, property) {
    const response = await api.post(`${BASE_URL}/${uuid}/toggle`, { property })
    return response.data
  }
}
