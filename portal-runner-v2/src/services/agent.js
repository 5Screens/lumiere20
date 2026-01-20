import api from './api'

/**
 * Send a message to the AI agent
 * @param {string} message - User message
 * @param {string} conversationId - Optional conversation ID for context
 * @param {string} inputMode - 'text' or 'voice' to indicate input method
 * @returns {Promise<Object>} Agent response
 */
export const sendMessage = async (message, conversationId = null, inputMode = 'text') => {
  try {
    const response = await api.post('/agent/chat', {
      message,
      conversationId,
      inputMode
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

/**
 * Delete a conversation
 * @param {string} conversationId - Conversation UUID
 * @returns {Promise<boolean>} True if deleted
 */
export const deleteConversation = async (conversationId) => {
  try {
    const response = await api.delete(`/agent/conversations/${conversationId}`)
    return response.data?.success || false
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to delete conversation'
    throw new Error(errorMessage)
  }
}

/**
 * Update feedback on a message
 * @param {string} messageId - Message UUID
 * @param {string} feedback - 'up', 'down', or null to clear
 * @returns {Promise<Object>} Updated message feedback
 */
export const updateMessageFeedback = async (messageId, feedback) => {
  try {
    const response = await api.patch(`/agent/messages/${messageId}/feedback`, { feedback })
    return response.data?.data || response.data || null
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to update feedback'
    throw new Error(errorMessage)
  }
}

/**
 * Upload attachments for a conversation (pending attachments for ticket creation)
 * @param {string} conversationId - Conversation UUID (optional, for linking)
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<Object[]>} Array of uploaded attachment info
 */
export const uploadAttachments = async (conversationId, files) => {
  try {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    // Upload to attachments endpoint with entity_type='agent_conversation'
    const entityType = 'agent_conversation'
    const entityUuid = conversationId || '00000000-0000-0000-0000-000000000000'
    
    const token = localStorage.getItem('portal_token')
    const url = `/api/v1/attachments/${entityType}/${entityUuid}`
    
    // Use fetch directly for FormData (not api.post which JSON.stringify)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
        // Note: Do NOT set Content-Type for FormData, browser sets it with boundary
      },
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    const errorMessage = error.message || 'Failed to upload attachments'
    throw new Error(errorMessage)
  }
}

/**
 * Get pending attachments for a conversation
 * @param {string} conversationId - Conversation UUID
 * @returns {Promise<Object[]>} Array of pending attachments
 */
export const getPendingAttachments = async (conversationId) => {
  try {
    const entityType = 'agent_conversation'
    const entityUuid = conversationId || '00000000-0000-0000-0000-000000000000'
    
    const response = await api.get(`/attachments/${entityType}/${entityUuid}`)
    return response.data || []
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to get attachments'
    throw new Error(errorMessage)
  }
}

/**
 * Delete an attachment
 * @param {string} attachmentUuid - Attachment UUID
 * @returns {Promise<boolean>} True if deleted
 */
export const deleteAttachment = async (attachmentUuid) => {
  try {
    await api.delete(`/attachments/${attachmentUuid}`)
    return true
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to delete attachment'
    throw new Error(errorMessage)
  }
}

export default {
  sendMessage,
  checkHealth,
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  updateMessageFeedback,
  uploadAttachments,
  getPendingAttachments,
  deleteAttachment
}
