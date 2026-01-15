/**
 * Agent Controller
 * HTTP handlers for agent endpoints
 */

const agentService = require('./agent.service');
const logger = require('../../../config/logger');

/**
 * POST /agent/chat
 * Process a chat message
 */
const chat = async (req, res) => {
  try {
    const { message, conversationId } = req.body;

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
      conversationId: conversationId || null
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
    return res.status(500).json({
      success: false,
      error: 'An error occurred while processing your message'
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

module.exports = {
  chat,
  health
};
