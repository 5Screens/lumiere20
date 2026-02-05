const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');
const { z } = require('zod');

// Validation schemas
const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  business_criticality: z.string().max(50).optional().nullable(),
  environment: z.string().max(100).optional().nullable(),
  price_model: z.string().max(100).optional().nullable(),
  currency: z.string().max(3).optional().nullable(),
  service_uuid: z.string().uuid(),
  operator_entity_uuid: z.string().uuid(),
  rel_status_uuid: z.string().uuid().optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  business_criticality: z.string().max(50).optional().nullable(),
  environment: z.string().max(100).optional().nullable(),
  price_model: z.string().max(100).optional().nullable(),
  currency: z.string().max(3).optional().nullable(),
  service_uuid: z.string().uuid().optional(),
  operator_entity_uuid: z.string().uuid().optional(),
  rel_status_uuid: z.string().uuid().optional().nullable(),
});

// Routes
router.post('/search', validate(primeVueFilterSchema), controller.search);
router.get('/', controller.getAll);
router.get('/by-service/:serviceUuid', controller.getByServiceUuid);
router.get('/:uuid', controller.getById);
router.post('/', validate(createSchema), controller.create);
router.put('/:uuid', validate(updateSchema), controller.update);
router.delete('/:uuid', controller.remove);
router.post('/delete-many', controller.removeMany);

module.exports = router;
