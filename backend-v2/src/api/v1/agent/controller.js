/**
 * Agent Controller
 * HTTP handlers for agent endpoints
 */

const agentService = require('./agent.service');
const conversationService = require('./conversation.service');
const { ocrProcess } = require('./mistral.client');
const logger = require('../../../config/logger');

/**
 * POST /agent/chat
 * Process a chat message
 */
const chat = async (req, res) => {
  try {
    const { message, conversationId, inputMode } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get user context from authenticated request
    const userContext = {
      userUuid: req.user?.uuid,
      locale: req.user?.language || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en',
      userName: req.user?.first_name || 'User',
      conversationId: conversationId || null,
      inputMode: inputMode === 'voice' ? 'voice' : 'text'
    };

    if (!userContext.userUuid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await agentService.processMessage(message.trim(), userContext);

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error(`-- agent-controller -- chat error: ${error.message}`, { stack: error.stack });
    
    // Handle specific LLM errors with friendly messages
    let friendlyMessage = 'An error occurred while processing your message. Please try again.';
    let statusCode = 500;

    if (error.message?.includes('503') || error.message?.includes('overflow')) {
      friendlyMessage = 'The AI service is temporarily overloaded. Please wait a moment and try again.';
      statusCode = 503;
    } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      friendlyMessage = 'AI service authentication error. Please contact support.';
      statusCode = 500;
    } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      friendlyMessage = 'Too many requests. Please wait a moment before trying again.';
      statusCode = 429;
    } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      friendlyMessage = 'The request took too long. Please try again.';
      statusCode = 504;
    }

    return res.status(statusCode).json({
      success: false,
      error: friendlyMessage
    });
  }
};

/**
 * GET /agent/health
 * Health check endpoint
 */
const health = async (req, res) => {
  try {
    const status = await agentService.healthCheck();
    const httpStatus = status.status === 'healthy' ? 200 : 503;
    return res.status(httpStatus).json(status);
  } catch (error) {
    logger.error(`-- agent-controller -- health error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
};

/**
 * GET /agent/conversations
 * Get user's conversations list
 */
const getConversations = async (req, res) => {
  try {
    const userUuid = req.user?.uuid;
    if (!userUuid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const limit = parseInt(req.query.limit) || 20;
    const conversations = await conversationService.getUserConversations(userUuid, limit);

    return res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    logger.error(`-- agent-controller -- getConversations error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversations'
    });
  }
};

/**
 * GET /agent/conversations/:uuid
 * Get a specific conversation with messages
 */
const getConversation = async (req, res) => {
  try {
    const userUuid = req.user?.uuid;
    const conversationUuid = req.params.uuid;

    if (!userUuid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const conversation = await conversationService.getOrCreateConversation(conversationUuid, userUuid);
    
    if (!conversation || conversation.user_uuid !== userUuid) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    return res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error(`-- agent-controller -- getConversation error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversation'
    });
  }
};

/**
 * POST /agent/conversations
 * Create a new conversation
 */
const createConversation = async (req, res) => {
  try {
    const userUuid = req.user?.uuid;
    if (!userUuid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const conversation = await conversationService.getOrCreateConversation(null, userUuid);

    return res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error(`-- agent-controller -- createConversation error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to create conversation'
    });
  }
};

/**
 * DELETE /agent/conversations/:uuid
 * Delete a conversation
 */
const deleteConversation = async (req, res) => {
  try {
    const userUuid = req.user?.uuid;
    const conversationUuid = req.params.uuid;

    if (!userUuid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const deleted = await conversationService.deleteConversation(conversationUuid, userUuid);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    return res.json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    logger.error(`-- agent-controller -- deleteConversation error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete conversation'
    });
  }
};

/**
 * PATCH /agent/messages/:uuid/feedback
 * Update feedback on a message
 */
const updateMessageFeedback = async (req, res) => {
  try {
    const userUuid = req.user?.uuid;
    const messageUuid = req.params.uuid;
    const { feedback } = req.body;

    if (!userUuid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Validate feedback value
    if (feedback !== null && feedback !== 'up' && feedback !== 'down') {
      return res.status(400).json({
        success: false,
        error: 'Invalid feedback value. Must be "up", "down", or null'
      });
    }

    const updated = await conversationService.updateMessageFeedback(messageUuid, userUuid, feedback);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    return res.json({
      success: true,
      data: { uuid: updated.uuid, feedback: updated.feedback }
    });
  } catch (error) {
    logger.error(`-- agent-controller -- updateMessageFeedback error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to update feedback'
    });
  }
};

/**
 * POST /agent/ocr
 * Process a document with OCR
 */
const ocr = async (req, res) => {
  try {
    const userUuid = req.user?.uuid;
    if (!userUuid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { documentBase64, documentUrl, mimeType, options } = req.body;

    if (!documentBase64 && !documentUrl) {
      return res.status(400).json({
        success: false,
        error: 'Either documentBase64 or documentUrl is required'
      });
    }

    // Validate mime type for supported formats
    const supportedMimeTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif',
      'image/avif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' // pptx
    ];

    if (mimeType && !supportedMimeTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported file type: ${mimeType}. Supported types: PDF, PNG, JPEG, WEBP, GIF, AVIF, DOCX, PPTX`
      });
    }

    logger.info(`-- agent-controller -- OCR request from user ${userUuid}, mimeType: ${mimeType}`);

    const result = await ocrProcess({
      documentBase64,
      documentUrl,
      mimeType,
      options: options || {}
    });

    return res.json({
      success: true,
      data: {
        markdown: result.markdown,
        pageCount: result.pages?.length || 0,
        executionTimeMs: result.executionTimeMs
      }
    });

  } catch (error) {
    logger.error(`-- agent-controller -- OCR error: ${error.message}`, { stack: error.stack });
    
    let friendlyMessage = 'An error occurred while processing the document. Please try again.';
    let statusCode = 500;

    if (error.message?.includes('503') || error.message?.includes('overflow')) {
      friendlyMessage = 'The OCR service is temporarily overloaded. Please wait a moment and try again.';
      statusCode = 503;
    } else if (error.message?.includes('timeout')) {
      friendlyMessage = 'The document processing took too long. Please try with a smaller document.';
      statusCode = 504;
    } else if (error.message?.includes('429')) {
      friendlyMessage = 'Too many requests. Please wait a moment before trying again.';
      statusCode = 429;
    }

    return res.status(statusCode).json({
      success: false,
      error: friendlyMessage
    });
  }
};

module.exports = {
  chat,
  health,
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  updateMessageFeedback,
  ocr
};
