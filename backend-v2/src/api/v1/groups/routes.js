const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');
const { z } = require('zod');

// Validation schemas
const createSchema = z.object({
  group_name: z.string().min(1).max(255),
  support_level: z.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
  rel_supervisor: z.string().uuid().optional().nullable(),
  rel_manager: z.string().uuid().optional().nullable(),
  rel_schedule: z.string().uuid().optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
});

const updateSchema = z.object({
  group_name: z.string().min(1).max(255).optional(),
  support_level: z.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
  rel_supervisor: z.string().uuid().optional().nullable(),
  rel_manager: z.string().uuid().optional().nullable(),
  rel_schedule: z.string().uuid().optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
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
