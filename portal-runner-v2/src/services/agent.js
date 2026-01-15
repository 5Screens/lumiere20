import api from './api'

/**
 * Send a message to the AI agent
 * @param {string} message - User message
 * @param {string} conversationId - Optional conversation ID for context
 * @returns {Promise<Object>} Agent response
 */
export const sendMessage = async (message, conversationId = null) => {
  try {
    const response = await api.post('/agent/chat', {
      message,
      conversationId
    })
    // Backend returns { success: true, data: { conversationId, response, metadata } }
    // Axios wraps in response.data, then our backend wraps in { success, data }
    const result = response.data?.data || response.data || response
    return result
  } catch (error) {
    // Extract friendly error message from backend response
    const errorMessage = error.response?.data?.error || error.message || 'An error occurred'
    throw new Error(errorMessage)
  }
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
