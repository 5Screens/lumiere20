const logger = require('../../../../config/logger');

/**
 * Context Manager - Manages conversation context and state
 * For now, uses in-memory storage. Can be extended to use Redis or DB.
 */

// In-memory context store (replace with Redis/DB for production)
const contextStore = new Map();

// Maximum messages to keep in context
const MAX_CONTEXT_MESSAGES = 20;

// Context expiration time (30 minutes)
const CONTEXT_EXPIRATION_MS = 30 * 60 * 1000;

/**
 * Get or create conversation context
 * @param {string} conversationId - Conversation UUID
 * @param {Object} userContext - User context
 * @returns {Object} Conversation context
 */
const getContext = async (conversationId, userContext) => {
  let context = contextStore.get(conversationId);

  if (context) {
    // Check if context has expired
    const age = Date.now() - new Date(context.lastActivity).getTime();
    if (age > CONTEXT_EXPIRATION_MS) {
      logger.info(`-- context-manager -- Context ${conversationId} expired, creating new one`);
      context = null;
    }
  }

  if (!context) {
    context = {
      conversationId,
      messages: [],
      userContext,
      state: {
        currentIntent: null,
        pendingAction: null,
        clarificationContext: null,
        ticketDraft: null
      },
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    contextStore.set(conversationId, context);
    logger.info(`-- context-manager -- Created new context for conversation ${conversationId}`);
  } else {
    // Update user context and last activity
    context.userContext = { ...context.userContext, ...userContext };
    context.lastActivity = new Date().toISOString();
  }

  return context;
};

/**
 * Add a message to conversation context
 * @param {Object} context - Conversation context
 * @param {Object} message - Message to add
 */
const addMessage = (context, message) => {
  context.messages.push(message);
  
  // Trim old messages if exceeding limit
  if (context.messages.length > MAX_CONTEXT_MESSAGES) {
    const removed = context.messages.splice(0, context.messages.length - MAX_CONTEXT_MESSAGES);
    logger.debug(`-- context-manager -- Trimmed ${removed.length} old messages from context`);
  }

  context.lastActivity = new Date().toISOString();
};

/**
 * Save conversation context
 * @param {string} conversationId - Conversation UUID
 * @param {Object} context - Context to save
 */
const saveContext = async (conversationId, context) => {
  context.lastActivity = new Date().toISOString();
  contextStore.set(conversationId, context);
  logger.debug(`-- context-manager -- Saved context for conversation ${conversationId}`);
};

/**
 * Update conversation state
 * @param {Object} context - Conversation context
 * @param {Object} stateUpdate - State updates to apply
 */
const updateState = (context, stateUpdate) => {
  context.state = { ...context.state, ...stateUpdate };
  context.lastActivity = new Date().toISOString();
};

/**
 * Clear conversation context
 * @param {string} conversationId - Conversation UUID
 */
const clearContext = (conversationId) => {
  contextStore.delete(conversationId);
  logger.info(`-- context-manager -- Cleared context for conversation ${conversationId}`);
};

/**
 * Get recent messages for LLM context
 * @param {Object} context - Conversation context
 * @param {number} maxMessages - Maximum messages to return
 * @returns {Array} Recent messages
 */
const getRecentMessages = (context, maxMessages = 10) => {
  const messages = context.messages || [];
  return messages.slice(-maxMessages);
};

/**
 * Build summary of conversation for LLM
 * @param {Object} context - Conversation context
 * @returns {string} Conversation summary
 */
const buildConversationSummary = (context) => {
  const messages = context.messages || [];
  if (messages.length === 0) return 'No previous messages.';

  const summary = messages.slice(-5).map(m => {
    const role = m.role === 'user' ? 'User' : 'Assistant';
    const content = m.content.length > 100 ? m.content.substring(0, 100) + '...' : m.content;
    return `${role}: ${content}`;
  }).join('\n');

  return summary;
};

/**
 * Cleanup expired contexts (call periodically)
 */
const cleanupExpiredContexts = () => {
  const now = Date.now();
  let cleaned = 0;

  for (const [id, context] of contextStore.entries()) {
    const age = now - new Date(context.lastActivity).getTime();
    if (age > CONTEXT_EXPIRATION_MS) {
      contextStore.delete(id);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info(`-- context-manager -- Cleaned up ${cleaned} expired contexts`);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredContexts, 5 * 60 * 1000);

module.exports = {
  getContext,
  addMessage,
  saveContext,
  updateState,
  clearContext,
  getRecentMessages,
  buildConversationSummary,
  cleanupExpiredContexts
};
