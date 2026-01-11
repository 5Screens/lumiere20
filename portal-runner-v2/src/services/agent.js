import api from './api'

/**
 * Send a message to the AI agent
 * @param {string} message - User message
 * @param {string} conversationId - Optional conversation ID for context
 * @returns {Promise<Object>} Agent response
 */
export const sendMessage = async (message, conversationId = null) => {
  const response = await api.post('/agent/chat', {
    message,
    conversationId
  })
  // Backend returns { success: true, data: {...} }
  return response.data || response
}

/**
 * Check agent health
 * @returns {Promise<Object>} Health status
 */
export const checkHealth = async () => {
  return api.get('/agent/health')
}

export default {
  sendMessage,
  checkHealth
}
