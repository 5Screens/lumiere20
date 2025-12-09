/**
 * CI Categories Routes
 * API endpoints for Configuration Item categories
 */

const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');

// POST /api/v1/ci_categories/search - Search CI categories with PrimeVue filters
router.post('/search', validate(primeVueFilterSchema), controller.search);

// GET /api/v1/ci_categories - Get all CI categories
router.get('/', controller.getAll);

// GET /api/v1/ci_categories/with-ci-types - Get all CI categories with their CI types
router.get('/with-ci-types', controller.getAllWithCiTypes);

// GET /api/v1/ci_categories/uncategorized - Get CI types without category
router.get('/uncategorized', controller.getUncategorizedCiTypes);

// GET /api/v1/ci_categories/options - Get CI categories as select options
router.get('/options', controller.getOptions);

// GET /api/v1/ci_categories/code/:code - Get CI category by code
router.get('/code/:code', controller.getByCode);

// GET /api/v1/ci_categories/:uuid - Get CI category by UUID
router.get('/:uuid', controller.getByUuid);

// POST /api/v1/ci_categories - Create a new CI category
router.post('/', controller.create);

// PUT /api/v1/ci_categories/:uuid - Update a CI category
router.put('/:uuid', controller.update);

// DELETE /api/v1/ci_categories/:uuid - Delete a CI category
router.delete('/:uuid', controller.remove);

module.exports = router;
