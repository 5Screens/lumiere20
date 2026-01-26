/**
 * Conversation Service
 * Manages agent conversations and messages in the database
 */

const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');

/**
 * Get or create a conversation
 * @param {string} conversationId - Existing conversation UUID or null
 * @param {string} userUuid - User UUID
 * @returns {Object} Conversation with messages
 */
const getOrCreateConversation = async (conversationId, userUuid) => {
  // If conversationId provided, try to find it
  if (conversationId) {
    const existing = await prisma.agent_conversations.findUnique({
      where: { uuid: conversationId },
      include: {
        messages: {
          orderBy: { created_at: 'asc' }
        }
      }
    });

    if (existing && existing.user_uuid === userUuid) {
      logger.debug(`-- conversation-service -- Found existing conversation: ${conversationId}`);
      return existing;
    }
  }

  // Create new conversation
  const newConversation = await prisma.agent_conversations.create({
    data: {
      user_uuid: userUuid
    },
    include: {
      messages: true
    }
  });

  logger.info(`-- conversation-service -- Created new conversation: ${newConversation.uuid}`);
  return newConversation;
};

/**
 * Add a message to a conversation
 * @param {string} conversationUuid - Conversation UUID
 * @param {Object} message - Message data
 * @returns {Object} Created message
 */
const addMessage = async (conversationUuid, message) => {
  const { role, content, toolCalls, toolCallId, toolName } = message;

  const created = await prisma.agent_messages.create({
    data: {
      conversation_uuid: conversationUuid,
      role,
      content,
      tool_calls: toolCalls || null,
      tool_call_id: toolCallId || null,
      tool_name: toolName || null
    }
  });

  // Update conversation timestamp
  await prisma.agent_conversations.update({
    where: { uuid: conversationUuid },
    data: { updated_at: new Date() }
  });

  logger.debug(`-- conversation-service -- Added ${role} message to ${conversationUuid}`);
  return created;
};

/**
 * Get conversation messages formatted for LLM
 * @param {string} conversationUuid - Conversation UUID
 * @param {number} limit - Max messages to return (default: 20)
 * @returns {Array} Messages formatted for Mistral API
 */
const getMessagesForLLM = async (conversationUuid, limit = 50) => {
  // Get the N most recent messages, then reverse to chronological order
  const messages = await prisma.agent_messages.findMany({
    where: { conversation_uuid: conversationUuid },
    orderBy: { created_at: 'desc' },
    take: limit
  });
  
  // Reverse to get chronological order (oldest first)
  messages.reverse();

  const formatted = [];
  
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    
    if (m.role === 'user') {
      formatted.push({ role: 'user', content: m.content || '' });
    } 
    else if (m.role === 'assistant') {
      const msg = { role: 'assistant' };
      if (m.content) {
        msg.content = m.content;
      }
      if (m.tool_calls && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
        msg.tool_calls = m.tool_calls;
      }
      formatted.push(msg);
    }
    else if (m.role === 'tool') {
      // Tool messages must have tool_call_id and content
      if (m.tool_call_id) {
        const toolMsg = {
          role: 'tool',
          tool_call_id: m.tool_call_id,
          content: m.content || '{}'
        };
        // Add name if available (as per Mistral docs)
        if (m.tool_name) {
          toolMsg.name = m.tool_name;
        }
        formatted.push(toolMsg);
      }
    }
  }

  // Validate message order: ensure we don't end with assistant that has tool_calls without tool responses
  // Mistral requires: after assistant with tool_calls, there must be tool messages
  const validated = [];
  for (let i = 0; i < formatted.length; i++) {
    const msg = formatted[i];
    validated.push(msg);
    
    // If assistant has tool_calls, check that tool responses follow
    if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
      const toolCallIds = msg.tool_calls.map(tc => tc.id);
      let allToolsFound = true;
      
      // Check if all tool responses exist in the remaining messages
      for (const tcId of toolCallIds) {
        const toolResponse = formatted.slice(i + 1).find(m => m.role === 'tool' && m.tool_call_id === tcId);
        if (!toolResponse) {
          allToolsFound = false;
          break;
        }
      }
      
      // If not all tool responses found, remove tool_calls from this assistant message
      if (!allToolsFound) {
        logger.warn(`-- conversation-service -- Removing incomplete tool_calls from message`);
        delete validated[validated.length - 1].tool_calls;
      }
    }
  }

  return validated;
};

/**
 * Update conversation title based on first user message
 * @param {string} conversationUuid - Conversation UUID
 * @param {string} firstMessage - First user message
 */
const updateTitle = async (conversationUuid, firstMessage) => {
  // Generate title from first message (first 50 chars)
  const title = firstMessage.length > 50 
    ? firstMessage.substring(0, 47) + '...'
    : firstMessage;

  await prisma.agent_conversations.update({
    where: { uuid: conversationUuid },
    data: { title }
  });
};

/**
 * Rename a conversation
 * @param {string} conversationUuid - Conversation UUID
 * @param {string} userUuid - User UUID (for ownership verification)
 * @param {string} newTitle - New title for the conversation
 * @returns {Object|null} Updated conversation or null if not found/not owned
 */
const renameConversation = async (conversationUuid, userUuid, newTitle) => {
  // Verify ownership
  const conversation = await prisma.agent_conversations.findUnique({
    where: { uuid: conversationUuid }
  });

  if (!conversation || conversation.user_uuid !== userUuid) {
    return null;
  }

  // Update title
  const updated = await prisma.agent_conversations.update({
    where: { uuid: conversationUuid },
    data: { title: newTitle.trim() }
  });

  logger.info(`-- conversation-service -- Renamed conversation ${conversationUuid} to: ${newTitle}`);
  return updated;
};

/**
 * Get user's recent conversations
 * @param {string} userUuid - User UUID
 * @param {number} limit - Max conversations to return
 * @returns {Array} Conversations
 */
const getUserConversations = async (userUuid, limit = 10) => {
  return prisma.agent_conversations.findMany({
    where: { user_uuid: userUuid },
    orderBy: { updated_at: 'desc' },
    take: limit,
    select: {
      uuid: true,
      title: true,
      created_at: true,
      updated_at: true
    }
  });
};

/**
 * Delete a conversation and all its messages
 * @param {string} conversationUuid - Conversation UUID
 * @param {string} userUuid - User UUID (for ownership verification)
 * @returns {boolean} True if deleted, false if not found or not owned
 */
const deleteConversation = async (conversationUuid, userUuid) => {
  // Verify ownership
  const conversation = await prisma.agent_conversations.findUnique({
    where: { uuid: conversationUuid }
  });

  if (!conversation || conversation.user_uuid !== userUuid) {
    return false;
  }

  // Delete messages first (cascade should handle this, but being explicit)
  await prisma.agent_messages.deleteMany({
    where: { conversation_uuid: conversationUuid }
  });

  // Delete conversation
  await prisma.agent_conversations.delete({
    where: { uuid: conversationUuid }
  });

  logger.info(`-- conversation-service -- Deleted conversation: ${conversationUuid}`);
  return true;
};

/**
 * Update feedback on a message
 * @param {string} messageUuid - Message UUID
 * @param {string} userUuid - User UUID (for ownership verification)
 * @param {string} feedback - 'up', 'down', or null to clear
 * @returns {Object|null} Updated message or null if not found/not owned
 */
const updateMessageFeedback = async (messageUuid, userUuid, feedback) => {
  // Find the message and verify ownership through conversation
  const message = await prisma.agent_messages.findUnique({
    where: { uuid: messageUuid },
    include: { conversation: true }
  });

  if (!message || message.conversation.user_uuid !== userUuid) {
    return null;
  }

  // Update feedback
  const updated = await prisma.agent_messages.update({
    where: { uuid: messageUuid },
    data: { feedback }
  });

  logger.debug(`-- conversation-service -- Updated feedback for message ${messageUuid}: ${feedback}`);
  return updated;
};

module.exports = {
  getOrCreateConversation,
  addMessage,
  getMessagesForLLM,
  updateTitle,
  renameConversation,
  getUserConversations,
  deleteConversation,
  updateMessageFeedback
};
