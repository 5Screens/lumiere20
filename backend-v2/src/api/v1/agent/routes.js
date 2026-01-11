const express = require('express');
const router = express.Router();
const controller = require('./controller');

// POST /api/v1/agent/chat - Main chat endpoint
router.post('/chat', controller.chat);

// GET /api/v1/agent/health - Health check
router.get('/health', controller.health);

module.exports = router;
