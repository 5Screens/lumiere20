/**
 * Workflows Routes
 * API endpoints for workflow management
 */

const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');

// ============================================
// WORKFLOWS
// ============================================

// POST /api/v1/workflows/search - Search with PrimeVue filters
router.post('/search', validate(primeVueFilterSchema), controller.search);

// GET /api/v1/workflows - Get all workflows
router.get('/', controller.getAll);

// GET /api/v1/workflows/:uuid - Get workflow by UUID with full details
router.get('/:uuid', controller.getByUuid);

// POST /api/v1/workflows - Create new workflow
router.post('/', controller.create);

// PUT /api/v1/workflows/:uuid - Update workflow
router.put('/:uuid', controller.update);

// DELETE /api/v1/workflows/:uuid - Delete workflow
router.delete('/:uuid', controller.remove);

// POST /api/v1/workflows/:uuid/duplicate - Duplicate workflow
router.post('/:uuid/duplicate', controller.duplicateWorkflow);

// PUT /api/v1/workflows/:uuid/save-all - Save all workflow changes
router.put('/:uuid/save-all', controller.saveAll);

// ============================================
// WORKFLOW STATUSES
// ============================================

// POST /api/v1/workflows/:workflowUuid/statuses - Create status
router.post('/:workflowUuid/statuses', controller.createStatus);

// PUT /api/v1/workflows/:workflowUuid/statuses/:statusUuid - Update status
router.put('/:workflowUuid/statuses/:statusUuid', controller.updateStatus);

// DELETE /api/v1/workflows/:workflowUuid/statuses/:statusUuid - Delete status
router.delete('/:workflowUuid/statuses/:statusUuid', controller.removeStatus);

// ============================================
// WORKFLOW TRANSITIONS
// ============================================

// POST /api/v1/workflows/:workflowUuid/transitions - Create transition
router.post('/:workflowUuid/transitions', controller.createTransition);

// PUT /api/v1/workflows/:workflowUuid/transitions/:transitionUuid - Update transition
router.put('/:workflowUuid/transitions/:transitionUuid', controller.updateTransition);

// DELETE /api/v1/workflows/:workflowUuid/transitions/:transitionUuid - Delete transition
router.delete('/:workflowUuid/transitions/:transitionUuid', controller.removeTransition);

// ============================================
// AVAILABLE STATUSES (for end users)
// ============================================

// GET /api/v1/workflows/:workflowUuid/available-statuses/:currentStatusUuid
router.get('/:workflowUuid/available-statuses/:currentStatusUuid', controller.getAvailableStatuses);

module.exports = router;
