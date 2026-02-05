const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search service offerings with PrimeVue filters
 * POST /api/v1/service-offerings/search
 */
const search = async (req, res, next) => {
  try {
    const result = await service.search(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error searching service offerings:', error);
    next(error);
  }
};

/**
 * Get all service offerings
 * GET /api/v1/service-offerings
 */
const getAll = async (req, res, next) => {
  try {
    const { page, limit, sortField, sortOrder, service_uuid } = req.query;
    const result = await service.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sortField: sortField || 'updated_at',
      sortOrder: parseInt(sortOrder) || -1,
      serviceUuid: service_uuid || null,
    });
    res.json(result);
  } catch (error) {
    logger.error('Error getting service offerings:', error);
    next(error);
  }
};

/**
 * Get service offerings by service UUID
 * GET /api/v1/service-offerings/by-service/:serviceUuid
 */
const getByServiceUuid = async (req, res, next) => {
  try {
    const { serviceUuid } = req.params;
    const items = await service.getByServiceUuid(serviceUuid);
    res.json(items);
  } catch (error) {
    logger.error('Error getting service offerings by service:', error);
    next(error);
  }
};

/**
 * Get service offering by UUID
 * GET /api/v1/service-offerings/:uuid
 */
const getById = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const item = await service.getById(uuid);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Service offering not found',
      });
    }

    res.json(item);
  } catch (error) {
    logger.error('Error getting service offering:', error);
    next(error);
  }
};

/**
 * Create new service offering
 * POST /api/v1/service-offerings
 */
const create = async (req, res, next) => {
  try {
    const item = await service.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    logger.error('Error creating service offering:', error);
    next(error);
  }
};

/**
 * Update service offering
 * PUT /api/v1/service-offerings/:uuid
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const item = await service.update(uuid, req.body);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Service offering not found',
      });
    }

    res.json(item);
  } catch (error) {
    logger.error('Error updating service offering:', error);
    next(error);
  }
};

/**
 * Delete service offering
 * DELETE /api/v1/service-offerings/:uuid
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const success = await service.remove(uuid);

    if (!success) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Service offering not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting service offering:', error);
    next(error);
  }
};

/**
 * Delete multiple service offerings
 * POST /api/v1/service-offerings/delete-many
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
    logger.error('Error deleting service offerings:', error);
    next(error);
  }
};

module.exports = {
  search,
  getAll,
  getByServiceUuid,
  getById,
  create,
  update,
  remove,
  removeMany,
};
