const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');
const { z } = require('zod');

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  configuration_item_uuid: z.string().uuid().optional().nullable(),
  requested_by_uuid: z.string().uuid().optional().nullable(),
  requested_for_uuid: z.string().uuid().optional().nullable(),
  writer_uuid: z.string().uuid(),
  rel_status_uuid: z.string().uuid().optional().nullable(),
  watchers: z.array(z.string().uuid()).optional().nullable(),
  extended_core_fields: z.record(z.any()).optional().nullable(),
  closed_at: z.string().optional().nullable(),
  assigned_to_group: z.string().uuid().optional().nullable(),
  assigned_to_person: z.string().uuid().optional().nullable(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  configuration_item_uuid: z.string().uuid().optional().nullable(),
  requested_by_uuid: z.string().uuid().optional().nullable(),
  requested_for_uuid: z.string().uuid().optional().nullable(),
  writer_uuid: z.string().uuid().optional(),
  rel_status_uuid: z.string().uuid().optional().nullable(),
  watchers: z.array(z.string().uuid()).optional().nullable(),
  extended_core_fields: z.record(z.any()).optional().nullable(),
  closed_at: z.string().optional().nullable(),
  assigned_to_group: z.string().uuid().optional().nullable(),
  assigned_to_person: z.string().uuid().optional().nullable(),
});

router.post('/search', validate(primeVueFilterSchema), controller.search);
router.get('/', controller.getAll);
router.get('/:uuid', controller.getByUuid);
router.post('/', validate(createSchema), controller.create);
router.put('/:uuid', validate(updateSchema), controller.update);
router.delete('/:uuid', controller.remove);
router.post('/delete-many', controller.removeMany);

module.exports = router;
