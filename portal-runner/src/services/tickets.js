import api from './api'

/**
 * Create a ticket via POST /api/v1/tickets
 * @param {Object} payload - Ticket data
 * @returns {Promise<Object>} Created ticket
 */
export const createTicket = (payload) =>
  api.post('/api/v1/tickets', payload)
