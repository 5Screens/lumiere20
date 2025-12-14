/**
 * Workflow Status Categories Routes
 * API endpoints for workflow status categories
 */

const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');

// POST /api/v1/workflow-status-categories/search - Search with PrimeVue filters
router.post('/search', validate(primeVueFilterSchema), controller.search);

// GET /api/v1/workflow-status-categories - Get all categories
router.get('/', controller.getAll);

// GET /api/v1/workflow-status-categories/options - Get as select options
router.get('/options', controller.getOptions);

// GET /api/v1/workflow-status-categories/:uuid - Get by UUID
router.get('/:uuid', controller.getByUuid);

// POST /api/v1/workflow-status-categories - Create new category
router.post('/', controller.create);

// PUT /api/v1/workflow-status-categories/:uuid - Update category
router.put('/:uuid', controller.update);

// DELETE /api/v1/workflow-status-categories/:uuid - Delete category
router.delete('/:uuid', controller.remove);

module.exports = router;
