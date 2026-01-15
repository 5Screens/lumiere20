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
 * @returns {Array} Messages formatted for LLM
 */
const getMessagesForLLM = async (conversationUuid, limit = 20) => {
  const messages = await prisma.agent_messages.findMany({
    where: { conversation_uuid: conversationUuid },
    orderBy: { created_at: 'asc' },
    take: limit
  });

  return messages.map(m => {
    const msg = { role: m.role };
    
    if (m.content) {
      msg.content = m.content;
    }
    
    if (m.tool_calls) {
      msg.tool_calls = m.tool_calls;
    }
    
    if (m.tool_call_id) {
      msg.tool_call_id = m.tool_call_id;
    }

    return msg;
  });
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

module.exports = {
  getOrCreateConversation,
  addMessage,
  getMessagesForLLM,
  updateTitle,
  getUserConversations
};
