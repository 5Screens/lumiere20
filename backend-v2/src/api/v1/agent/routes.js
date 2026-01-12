const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../../middleware/auth');

// POST /api/v1/agent/chat - Main chat endpoint (requires authentication)
router.post('/chat', authenticate, controller.chat);

// GET /api/v1/agent/health - Health check
router.get('/health', controller.health);

module.exports = router;
