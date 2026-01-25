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

// GET /api/v1/agent/conversations - Get user's conversations list
router.get('/conversations', authenticate, controller.getConversations);

// POST /api/v1/agent/conversations - Create a new conversation
router.post('/conversations', authenticate, controller.createConversation);

// GET /api/v1/agent/conversations/:uuid - Get a specific conversation with messages
router.get('/conversations/:uuid', authenticate, controller.getConversation);

// DELETE /api/v1/agent/conversations/:uuid - Delete a conversation
router.delete('/conversations/:uuid', authenticate, controller.deleteConversation);

// PATCH /api/v1/agent/messages/:uuid/feedback - Update message feedback
router.patch('/messages/:uuid/feedback', authenticate, controller.updateMessageFeedback);

// GET /api/v1/agent/health - Health check (no auth required)
router.get('/health', controller.health);

// POST /api/v1/agent/ocr - Process a document with OCR
router.post('/ocr', authenticate, controller.ocr);

module.exports = router;
