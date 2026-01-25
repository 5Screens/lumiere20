/**
 * OCR Documents Routes
 * API routes for OCR document management
 */

const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../../middleware/auth');

// GET /api/v1/ocr-documents - Get all OCR documents for current user
router.get('/', authenticate, controller.getAll);

// GET /api/v1/ocr-documents/:uuid - Get a specific OCR document
router.get('/:uuid', authenticate, controller.getByUuid);

// POST /api/v1/ocr-documents - Create a new OCR document
router.post('/', authenticate, controller.create);

// DELETE /api/v1/ocr-documents/:uuid - Delete an OCR document
router.delete('/:uuid', authenticate, controller.remove);

module.exports = router;
