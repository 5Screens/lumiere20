import api from './api'

const ENDPOINT = '/tickets'

export default {
  /**
   * Search tickets with optional ticket_type_code filter
   * @param {Object} params - Search parameters (filters, sortField, sortOrder, page, limit)
   * @param {string} ticketTypeCode - Optional ticket type filter (TASK, INCIDENT, PROBLEM, PROJECT)
   */
  async search(params = {}, ticketTypeCode = null) {
    const payload = JSON.parse(JSON.stringify(params))
    
    // Add ticket_type_code filter if specified
    if (ticketTypeCode) {
      if (!payload.filters) {
        payload.filters = {}
      }
      payload.filters.ticket_type_code = {
        value: ticketTypeCode,
        matchMode: 'equals'
      }
    }
    
    const response = await api.post(`${ENDPOINT}/search`, payload)
    return response.data
  },

  async getAll(params = {}) {
    const response = await api.get(ENDPOINT, { params })
    return response.data
  },

  async getByUuid(uuid) {
    const response = await api.get(`${ENDPOINT}/${uuid}`)
    return response.data
  },

  async create(data) {
    const response = await api.post(ENDPOINT, data)
    return response.data
  },

  async update(uuid, data) {
    const response = await api.put(`${ENDPOINT}/${uuid}`, data)
    return response.data
  },

  async delete(uuid) {
    await api.delete(`${ENDPOINT}/${uuid}`)
  },

  async deleteMany(uuids) {
    const response = await api.post(`${ENDPOINT}/delete-many`, { uuids })
    return response.data
  },

  /**
   * Get extended fields definition for a ticket type
   * @param {string} ticketTypeCode - Ticket type code (TASK, INCIDENT, PROBLEM, PROJECT)
   */
  async getTypeFields(ticketTypeCode) {
    const response = await api.get(`${ENDPOINT}/type/${ticketTypeCode}/fields`)
    return response.data
  },
}
