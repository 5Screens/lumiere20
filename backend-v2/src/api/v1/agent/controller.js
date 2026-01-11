const logger = require('../../../config/logger');
const agentService = require('./service');

/**
 * POST /api/v1/agent/chat
 * Main chat endpoint for the agentic AI
 */
const chat = async (req, res) => {
  try {
    const { message, conversationId, context } = req.body;

    // Validate required fields
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string'
      });
    }

    logger.info(`Agent chat request received`, { 
      conversationId, 
      messageLength: message.length 
    });

    // Build user context from request
    const userContext = {
      userId: req.user?.uuid || null,
      email: req.user?.email || null,
      firstName: req.user?.first_name || null,
      lastName: req.user?.last_name || null,
      locale: req.headers['accept-language']?.split(',')[0] || 'fr',
      conversationId: conversationId || null,
      ...context
    };

    // Process message through agent service
    const response = await agentService.processMessage(message, userContext);

    logger.info(`Agent chat response generated`, { 
      conversationId: response.conversationId,
      intent: response.intent,
      toolsExecuted: response.toolsExecuted?.length || 0
    });

    return res.json({
      success: true,
      data: response
    });

  } catch (error) {
    logger.error(`Agent chat error: ${error.message}`, { stack: error.stack });
    
    return res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/v1/agent/health
 * Health check endpoint
 */
const health = async (req, res) => {
  try {
    const status = await agentService.healthCheck();
    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error(`Agent health check error: ${error.message}`);
    return res.status(503).json({
      success: false,
      error: 'Agent service unhealthy',
      details: error.message
    });
  }
};

module.exports = {
  chat,
  health
};
