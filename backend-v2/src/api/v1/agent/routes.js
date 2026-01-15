/**
 * Agent Routes
 * API routes for the AI agent
 */

const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../../middleware/auth');

// POST /api/v1/agent/chat - Process a chat message
router.post('/chat', authenticate, controller.chat);

// GET /api/v1/agent/health - Health check (no auth required)
router.get('/health', controller.health);

module.exports = router;
