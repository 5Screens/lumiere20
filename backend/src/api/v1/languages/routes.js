/**
 * Languages Routes
 * API endpoints for language management
 */

const express = require('express');
const router = express.Router();
const controller = require('./controller');

// POST /api/v1/languages/search - Search languages with PrimeVue filters
router.post('/search', controller.search);

// POST /api/v1/languages/delete-many - Delete multiple languages
router.post('/delete-many', controller.removeMany);

// GET /api/v1/languages - Get all languages
router.get('/', controller.getAll);

// GET /api/v1/languages/active - Get active languages only
router.get('/active', controller.getActive);

// POST /api/v1/languages/bulk-toggle - Bulk update active status
router.post('/bulk-toggle', controller.bulkToggleActive);

// GET /api/v1/languages/code/:code - Get language by code
router.get('/code/:code', controller.getByCode);

// GET /api/v1/languages/:uuid - Get language by UUID
router.get('/:uuid', controller.getByUuid);

// POST /api/v1/languages - Create a new language
router.post('/', controller.create);

// PUT /api/v1/languages/:uuid - Update a language
router.put('/:uuid', controller.update);

// PATCH /api/v1/languages/:uuid/toggle - Toggle language active status
router.patch('/:uuid/toggle', controller.toggleActive);

// DELETE /api/v1/languages/:uuid - Delete a language
router.delete('/:uuid', controller.remove);

module.exports = router;
