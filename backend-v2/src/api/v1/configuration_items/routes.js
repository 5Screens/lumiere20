const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');
const { z } = require('zod');

// Validation schemas
const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  ci_type: z.string().max(50).optional().default('GENERIC'),
  extended_core_fields: z.record(z.any()).optional().default({}),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  ci_type: z.string().max(50).optional(),
  extended_core_fields: z.record(z.any()).optional(),
});

// Routes
router.post('/search', validate(primeVueFilterSchema), controller.search);
router.get('/', controller.getAll);
router.get('/:uuid', controller.getById);
router.post('/', validate(createSchema), controller.create);
router.put('/:uuid', validate(updateSchema), controller.update);
router.delete('/:uuid', controller.remove);
router.post('/delete-many', controller.removeMany);

module.exports = router;
