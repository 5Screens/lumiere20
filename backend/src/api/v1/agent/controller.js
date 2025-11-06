const agentService = require('./service');
const logger = require('../../../config/logger');

/**
 * Handle chat message from user
 */
const chat = async (req, res) => {
  logger.info('[AGENT CONTROLLER] Received chat request');

  try {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required and must be a non-empty string'
      });
    }

    logger.info(`[AGENT CONTROLLER] User message: ${message.substring(0, 100)}...`);

    // Call agent service
    const response = await agentService.sendMessageToAgent(message, conversationHistory);

    logger.info('[AGENT CONTROLLER] Sending response to client');

    return res.status(200).json({
      success: true,
      data: {
        message: response.message,
        model: response.model,
        usage: response.usage
      }
    });

  } catch (error) {
    logger.error('[AGENT CONTROLLER] Error in chat:', error.message);

    // Handle specific errors
    if (error.message.includes('AI configuration missing')) {
      return res.status(500).json({
        error: 'AI service not configured properly',
        details: error.message
      });
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'AI service timeout - please try again'
      });
    }

    if (error.response?.status === 401) {
      return res.status(500).json({
        error: 'AI service authentication failed'
      });
    }

    return res.status(500).json({
      error: 'Error communicating with AI agent',
      details: error.message
    });
  }
};

module.exports = {
  chat
};
