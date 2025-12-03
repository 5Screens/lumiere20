/**
 * CI Type Fields Routes
 * API endpoints for CI type extended fields
 */

const express = require('express');
const router = express.Router();
const controller = require('./controller');

// POST /api/v1/ci_type_fields/delete-many - Delete multiple fields
router.post('/delete-many', controller.removeMany);

// GET /api/v1/ci_type_fields/type/:ciTypeUuid - Get all fields for a CI type
router.get('/type/:ciTypeUuid', controller.getByTypeUuid);

// POST /api/v1/ci_type_fields/type/:ciTypeUuid/reorder - Reorder fields
router.post('/type/:ciTypeUuid/reorder', controller.reorder);

// GET /api/v1/ci_type_fields/:uuid - Get a single field
router.get('/:uuid', controller.getByUuid);

// POST /api/v1/ci_type_fields - Create a new field
router.post('/', controller.create);

// PUT /api/v1/ci_type_fields/:uuid - Update a field
router.put('/:uuid', controller.update);

// POST /api/v1/ci_type_fields/:uuid/toggle - Toggle visibility
router.post('/:uuid/toggle', controller.toggleVisibility);

// DELETE /api/v1/ci_type_fields/:uuid - Delete a field
router.delete('/:uuid', controller.remove);

module.exports = router;
