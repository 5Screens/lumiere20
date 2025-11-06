const express = require('express');
const router = express.Router();
const agentController = require('./controller');
const { validateChatMessage } = require('./validation');
const logger = require('../../../config/logger');

/**
 * POST /api/v1/agent/chat
 * Send a message to the AI agent
 */
router.post('/chat', validateChatMessage, (req, res) => {
  logger.info('[AGENT ROUTES] Handling POST /agent/chat request');
  agentController.chat(req, res);
});

/**
 * GET /api/v1/agent/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  logger.info('[AGENT ROUTES] Handling GET /agent/health request');
  
  const isConfigured = !!(
    process.env.INFOMANIAK_AI_API_URL && 
    process.env.INFOMANIAK_AI_TOKEN
  );

  res.status(200).json({
    status: 'ok',
    configured: isConfigured,
    model: process.env.INFOMANIAK_AI_MODEL || 'mixtral'
  });
});

module.exports = router;
