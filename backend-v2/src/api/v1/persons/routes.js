const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');
const { z } = require('zod');

// Validation schemas
const createSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  job_role: z.string().max(255).optional().nullable(),
  ref_entity_uuid: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  critical_user: z.boolean().optional().default(false),
  external_user: z.boolean().optional().default(false),
  date_format: z.string().max(50).optional().nullable(),
  internal_id: z.string().max(100).optional().nullable(),
  notification: z.boolean().optional().default(true),
  time_zone: z.string().max(100).optional().nullable(),
  ref_location_uuid: z.string().uuid().optional().nullable(),
  floor: z.string().max(50).optional().nullable(),
  room: z.string().max(50).optional().nullable(),
  ref_approving_manager_uuid: z.string().uuid().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  business_phone: z.string().max(50).optional().nullable(),
  business_mobile_phone: z.string().max(50).optional().nullable(),
  personal_mobile_phone: z.string().max(50).optional().nullable(),
  language: z.string().max(10).optional().nullable(),
  role: z.string().max(50).optional().default('user'),
  roles: z.record(z.any()).optional().nullable(),
  photo: z.string().optional().nullable(),
});

const updateSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  job_role: z.string().max(255).optional().nullable(),
  ref_entity_uuid: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional(),
  critical_user: z.boolean().optional(),
  external_user: z.boolean().optional(),
  date_format: z.string().max(50).optional().nullable(),
  internal_id: z.string().max(100).optional().nullable(),
  notification: z.boolean().optional(),
  time_zone: z.string().max(100).optional().nullable(),
  ref_location_uuid: z.string().uuid().optional().nullable(),
  floor: z.string().max(50).optional().nullable(),
  room: z.string().max(50).optional().nullable(),
  ref_approving_manager_uuid: z.string().uuid().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  business_phone: z.string().max(50).optional().nullable(),
  business_mobile_phone: z.string().max(50).optional().nullable(),
  personal_mobile_phone: z.string().max(50).optional().nullable(),
  language: z.string().max(10).optional().nullable(),
  role: z.string().max(50).optional(),
  roles: z.record(z.any()).optional().nullable(),
  photo: z.string().optional().nullable(),
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
