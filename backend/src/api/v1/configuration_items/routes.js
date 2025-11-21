const express = require('express');
const router = express.Router();
const controller = require('./controller');

// GET /api/v1/configuration_items - Get all configuration items with pagination
router.get('/', controller.getConfigurationItems);

// GET /api/v1/configuration_items/schemas - Get CI type schemas
router.get('/schemas', controller.getCITypeSchemas);

// GET /api/v1/configuration_items/:uuid - Get configuration item by UUID
router.get('/:uuid', controller.getConfigurationItemById);

// POST /api/v1/configuration_items - Create new configuration item
router.post('/', controller.createConfigurationItem);

// PATCH /api/v1/configuration_items/:uuid - Update configuration item
router.patch('/:uuid', controller.updateConfigurationItem);

// DELETE /api/v1/configuration_items/:uuid - Delete configuration item
router.delete('/:uuid', controller.deleteConfigurationItem);

module.exports = router;
