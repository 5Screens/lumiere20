const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');
const { z } = require('zod');

// Validation schemas
const createSchema = z.object({
  name: z.string().min(1).max(255),
  entity_id: z.string().min(1).max(50),
  external_id: z.string().max(100).optional().nullable(),
  entity_type: z.string().min(1).max(50),
  budget_approver_uuid: z.string().uuid().optional().nullable(),
  rel_headquarters_location: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  parent_uuid: z.string().uuid().optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  entity_id: z.string().min(1).max(50).optional(),
  external_id: z.string().max(100).optional().nullable(),
  entity_type: z.string().min(1).max(50).optional(),
  budget_approver_uuid: z.string().uuid().optional().nullable(),
  rel_headquarters_location: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional(),
  parent_uuid: z.string().uuid().optional().nullable(),
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
