/**
 * Ticket Types Routes
 * API endpoints for ticket types CRUD
 */

const express = require('express');
const router = express.Router();
const controller = require('./controller');

// GET /api/v1/ticket-types - Get all ticket types
router.get('/', controller.getAll);

// GET /api/v1/ticket-types/options - Get options for select fields (MUST be before /:uuid)
router.get('/options', controller.getOptions);

// POST /api/v1/ticket-types/search - Search with pagination
router.post('/search', controller.search);

// GET /api/v1/ticket-types/:uuid - Get by UUID
router.get('/:uuid', controller.getByUuid);

// POST /api/v1/ticket-types - Create new ticket type
router.post('/', controller.create);

// PUT /api/v1/ticket-types/:uuid - Update ticket type
router.put('/:uuid', controller.update);

// DELETE /api/v1/ticket-types/:uuid - Delete ticket type
router.delete('/:uuid', controller.remove);

module.exports = router;
