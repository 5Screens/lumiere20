/**
 * Workflow Entity Config Routes
 * API endpoints for workflow entity configuration
 */

const express = require('express');
const router = express.Router();
const controller = require('./controller');

// GET /api/v1/workflow-entity-config - Get all configurations
router.get('/', controller.getAll);

// GET /api/v1/workflow-entity-config/entity/:entityType - Get config by entity type
router.get('/entity/:entityType', controller.getByEntityType);

// GET /api/v1/workflow-entity-config/entity/:entityType/subtypes - Get available subtypes for an entity type
router.get('/entity/:entityType/subtypes', controller.getSubtypes);

// GET /api/v1/workflow-entity-config/entity/:entityType/instance/:entityUuid - Get subtype for a specific entity instance
router.get('/entity/:entityType/instance/:entityUuid', controller.getEntitySubtype);

// GET /api/v1/workflow-entity-config/:uuid - Get by UUID
router.get('/:uuid', controller.getByUuid);

// POST /api/v1/workflow-entity-config - Create new configuration
router.post('/', controller.create);

// PUT /api/v1/workflow-entity-config/:uuid - Update configuration
router.put('/:uuid', controller.update);

// DELETE /api/v1/workflow-entity-config/:uuid - Delete configuration
router.delete('/:uuid', controller.remove);

module.exports = router;
