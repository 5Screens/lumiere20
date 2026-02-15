const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');
const { z } = require('zod');

// Validation schemas
const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  owning_entity_uuid: z.string().uuid().optional().nullable(),
  owned_by_uuid: z.string().uuid().optional().nullable(),
  managed_by_uuid: z.string().uuid().optional().nullable(),
  business_criticality: z.string().max(50).optional().nullable(),
  rel_status_uuid: z.string().uuid().optional().nullable(),
  version: z.string().max(50).optional().nullable(),
  operational: z.string().max(50).optional().nullable(),
  legal_regulatory: z.string().max(50).optional().nullable(),
  reputational: z.string().max(50).optional().nullable(),
  financial: z.string().max(50).optional().nullable(),
  comments: z.string().optional().nullable(),
  cab_uuid: z.string().uuid().optional().nullable(),
  parent_uuid: z.string().uuid().optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  owning_entity_uuid: z.string().uuid().optional().nullable(),
  owned_by_uuid: z.string().uuid().optional().nullable(),
  managed_by_uuid: z.string().uuid().optional().nullable(),
  business_criticality: z.string().max(50).optional().nullable(),
  rel_status_uuid: z.string().uuid().optional().nullable(),
  version: z.string().max(50).optional().nullable(),
  operational: z.string().max(50).optional().nullable(),
  legal_regulatory: z.string().max(50).optional().nullable(),
  reputational: z.string().max(50).optional().nullable(),
  financial: z.string().max(50).optional().nullable(),
  comments: z.string().optional().nullable(),
  cab_uuid: z.string().uuid().optional().nullable(),
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
router.post('/:uuid/sync-symptoms', controller.syncSymptoms);
router.post('/:uuid/sync-causes', controller.syncCauses);

module.exports = router;
