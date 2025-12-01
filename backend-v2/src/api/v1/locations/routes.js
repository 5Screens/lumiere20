const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');
const { z } = require('zod');

// Validation schemas
const createSchema = z.object({
  name: z.string().min(1).max(255),
  primary_entity_uuid: z.string().uuid().optional().nullable(),
  field_service_group_uuid: z.string().uuid().optional().nullable(),
  rel_status_uuid: z.string().uuid().optional().nullable(),
  site_created_on: z.string().datetime().optional().nullable(),
  site_id: z.string().max(100).optional().nullable(),
  type: z.string().max(100).optional().nullable(),
  business_criticality: z.string().max(50).optional().nullable(),
  opening_hours: z.string().max(255).optional().nullable(),
  parent_uuid: z.string().uuid().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  time_zone: z.string().max(100).optional().nullable(),
  street: z.string().max(255).optional().nullable(),
  city: z.string().max(255).optional().nullable(),
  state_province: z.string().max(255).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  comments: z.string().optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  primary_entity_uuid: z.string().uuid().optional().nullable(),
  field_service_group_uuid: z.string().uuid().optional().nullable(),
  rel_status_uuid: z.string().uuid().optional().nullable(),
  site_created_on: z.string().datetime().optional().nullable(),
  site_id: z.string().max(100).optional().nullable(),
  type: z.string().max(100).optional().nullable(),
  business_criticality: z.string().max(50).optional().nullable(),
  opening_hours: z.string().max(255).optional().nullable(),
  parent_uuid: z.string().uuid().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  time_zone: z.string().max(100).optional().nullable(),
  street: z.string().max(255).optional().nullable(),
  city: z.string().max(255).optional().nullable(),
  state_province: z.string().max(255).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  comments: z.string().optional().nullable(),
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
