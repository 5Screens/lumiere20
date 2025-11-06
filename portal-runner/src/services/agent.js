import api from './api'

/**
 * Send a message to the AI agent
 * @param {string} message - User's message
 * @param {Array} conversationHistory - Optional conversation history
 * @returns {Promise} - API response
 */
export const sendMessage = async (message, conversationHistory = []) => {
  try {
    const response = await api.post('/api/v1/agent/chat', {
      message,
      conversationHistory
    })
    return response.data
  } catch (error) {
    console.error('[Agent Service] Error sending message:', error)
    throw error
  }
}

/**
 * Check agent health
 * @returns {Promise} - Health status
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/api/v1/agent/health')
    return response.data
  } catch (error) {
    console.error('[Agent Service] Error checking health:', error)
    throw error
  }
}

export default {
  sendMessage,
  checkHealth
}
