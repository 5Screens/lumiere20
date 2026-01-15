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

/**
 * Get user's conversations list
 * @param {number} limit - Max conversations to return (default: 20)
 * @returns {Promise<Array>} List of conversations
 */
export const getConversations = async (limit = 20) => {
  try {
    const response = await api.get('/agent/conversations', { params: { limit } })
    return response.data?.data || response.data || []
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to get conversations'
    throw new Error(errorMessage)
  }
}

/**
 * Get a specific conversation with messages
 * @param {string} conversationId - Conversation UUID
 * @returns {Promise<Object>} Conversation with messages
 */
export const getConversation = async (conversationId) => {
  try {
    const response = await api.get(`/agent/conversations/${conversationId}`)
    return response.data?.data || response.data || null
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to get conversation'
    throw new Error(errorMessage)
  }
}

/**
 * Create a new conversation
 * @returns {Promise<Object>} New conversation
 */
export const createConversation = async () => {
  try {
    const response = await api.post('/agent/conversations')
    return response.data?.data || response.data || null
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to create conversation'
    throw new Error(errorMessage)
  }
}

export default {
  sendMessage,
  checkHealth,
  getConversations,
  getConversation,
  createConversation
}
