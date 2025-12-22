/**
 * Object Setup Routes
 * API endpoints for business objects metadata configuration
 */

const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');

// POST /api/v1/object-setup/search - Search object setup with PrimeVue filters
router.post('/search', validate(primeVueFilterSchema), controller.search);

// GET /api/v1/object-setup - Get all object setup records
router.get('/', controller.getAll);

// GET /api/v1/object-setup/options - Get object setup as select options
router.get('/options', controller.getOptions);

// GET /api/v1/object-setup/object-types - Get distinct object types
router.get('/object-types', controller.getObjectTypes);

// GET /api/v1/object-setup/metadata-types - Get distinct metadata types for an object_type
router.get('/metadata-types', controller.getMetadataTypes);

// GET /api/v1/object-setup/:uuid - Get object setup by UUID
router.get('/:uuid', controller.getByUuid);

// POST /api/v1/object-setup - Create a new object setup record
router.post('/', controller.create);

// PUT /api/v1/object-setup/:uuid - Update an object setup record
router.put('/:uuid', controller.update);

// DELETE /api/v1/object-setup/:uuid - Delete an object setup record
router.delete('/:uuid', controller.remove);

module.exports = router;
