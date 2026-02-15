const service = require('./service');
const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');

/**
 * Search services with PrimeVue filters
 * POST /api/v1/services/search
 */
const search = async (req, res, next) => {
  try {
    const result = await service.search(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error searching services:', error);
    next(error);
  }
};

/**
 * Get all services
 * GET /api/v1/services
 */
const getAll = async (req, res, next) => {
  try {
    const { page, limit, sortField, sortOrder } = req.query;
    const result = await service.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sortField: sortField || 'updated_at',
      sortOrder: parseInt(sortOrder) || -1,
    });
    res.json(result);
  } catch (error) {
    logger.error('Error getting services:', error);
    next(error);
  }
};

/**
 * Get service by UUID
 * GET /api/v1/services/:uuid
 */
const getById = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const item = await service.getById(uuid);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Service not found',
      });
    }

    res.json(item);
  } catch (error) {
    logger.error('Error getting service:', error);
    next(error);
  }
};

/**
 * Create new service
 * POST /api/v1/services
 */
const create = async (req, res, next) => {
  try {
    const item = await service.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    logger.error('Error creating service:', error);
    next(error);
  }
};

/**
 * Update service
 * PUT /api/v1/services/:uuid
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    logger.info('Update service request:', { uuid, body: req.body });
    const item = await service.update(uuid, req.body);
    logger.info('Update service result:', { uuid, updated: !!item });

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Service not found',
      });
    }

    res.json(item);
  } catch (error) {
    logger.error('Error updating service:', error);
    next(error);
  }
};

/**
 * Delete service
 * DELETE /api/v1/services/:uuid
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const success = await service.remove(uuid);

    if (!success) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Service not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting service:', error);
    next(error);
  }
};

/**
 * Delete multiple services
 * POST /api/v1/services/delete-many
 */
const removeMany = async (req, res, next) => {
  try {
    const { uuids } = req.body;

    if (!Array.isArray(uuids) || uuids.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'uuids must be a non-empty array',
      });
    }

    const count = await service.removeMany(uuids);
    res.json({ deleted: count });
  } catch (error) {
    logger.error('Error deleting services:', error);
    next(error);
  }
};

/**
 * Sync symptoms linked to a service
 * POST /api/v1/services/:uuid/sync-symptoms
 */
const syncSymptoms = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const { add = [], remove: toRemove = [] } = req.body;

    if (toRemove.length > 0) {
      await prisma.rel_symptoms_services.deleteMany({
        where: {
          rel_service_uuid: uuid,
          rel_symptom_uuid: { in: toRemove }
        }
      });
      logger.info(`Service ${uuid}: unlinked ${toRemove.length} symptoms`);
    }

    if (add.length > 0) {
      const existing = await prisma.rel_symptoms_services.findMany({
        where: { rel_service_uuid: uuid, rel_symptom_uuid: { in: add } },
        select: { rel_symptom_uuid: true }
      });
      const existingSet = new Set(existing.map(e => e.rel_symptom_uuid));
      const toCreate = add.filter(id => !existingSet.has(id));

      if (toCreate.length > 0) {
        await prisma.rel_symptoms_services.createMany({
          data: toCreate.map(symptomUuid => ({
            rel_service_uuid: uuid,
            rel_symptom_uuid: symptomUuid
          }))
        });
        logger.info(`Service ${uuid}: linked ${toCreate.length} symptoms`);
      }
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error syncing symptoms for service:', error);
    next(error);
  }
};

/**
 * Sync causes linked to a service
 * POST /api/v1/services/:uuid/sync-causes
 */
const syncCauses = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const { add = [], remove: toRemove = [] } = req.body;

    if (toRemove.length > 0) {
      await prisma.rel_causes_services.deleteMany({
        where: {
          rel_service_uuid: uuid,
          rel_cause_uuid: { in: toRemove }
        }
      });
      logger.info(`Service ${uuid}: unlinked ${toRemove.length} causes`);
    }

    if (add.length > 0) {
      const existing = await prisma.rel_causes_services.findMany({
        where: { rel_service_uuid: uuid, rel_cause_uuid: { in: add } },
        select: { rel_cause_uuid: true }
      });
      const existingSet = new Set(existing.map(e => e.rel_cause_uuid));
      const toCreate = add.filter(id => !existingSet.has(id));

      if (toCreate.length > 0) {
        await prisma.rel_causes_services.createMany({
          data: toCreate.map(causeUuid => ({
            rel_service_uuid: uuid,
            rel_cause_uuid: causeUuid
          }))
        });
        logger.info(`Service ${uuid}: linked ${toCreate.length} causes`);
      }
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error syncing causes for service:', error);
    next(error);
  }
};

module.exports = {
  search,
  getAll,
  getById,
  create,
  update,
  remove,
  removeMany,
  syncSymptoms,
  syncCauses,
};
