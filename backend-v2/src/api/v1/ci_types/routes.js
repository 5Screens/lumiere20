/**
 * CI Types Routes
 * API endpoints for Configuration Item types
 */

const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');

// POST /api/v1/ci_types/search - Search CI types with PrimeVue filters
router.post('/search', validate(primeVueFilterSchema), controller.search);

// POST /api/v1/ci_types/delete-many - Delete multiple CI types
router.post('/delete-many', controller.removeMany);

// GET /api/v1/ci_types - Get all CI types
router.get('/', controller.getAll);

// GET /api/v1/ci_types/options - Get CI types as select options
router.get('/options', controller.getOptions);

// GET /api/v1/ci_types/:code/fields - Get extended fields for a CI type
router.get('/:code/fields', controller.getFields);

// GET /api/v1/ci_types/:code/with-fields - Get CI type with fields included
router.get('/:code/with-fields', controller.getByCodeWithFields);

// GET /api/v1/ci_types/:code - Get CI type by code
router.get('/:code', controller.getByCode);

// POST /api/v1/ci_types - Create a new CI type
router.post('/', controller.create);

// PUT /api/v1/ci_types/:uuid - Update a CI type
router.put('/:uuid', controller.update);

// DELETE /api/v1/ci_types/:uuid - Delete a CI type
router.delete('/:uuid', controller.remove);

module.exports = router;
