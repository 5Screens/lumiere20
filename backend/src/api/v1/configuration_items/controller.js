const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search configuration items with PrimeVue filters
 * POST /api/v1/configuration_items/search
 */
const search = async (req, res, next) => {
  try {
    logger.info('[CONTROLLER] req.body keys:', Object.keys(req.body));
    logger.info('[CONTROLLER] Full req.body:', JSON.stringify(req.body));
    logger.info('[CONTROLLER] ciTypeUuid in body?:', 'ciTypeUuid' in req.body);
    logger.info('[CONTROLLER] req.body.ciTypeUuid:', req.body.ciTypeUuid);
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const result = await service.search(req.body, locale);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all configuration items
 * GET /api/v1/configuration_items
 */
const getAll = async (req, res, next) => {
  try {
    const { page, limit, sortField, sortOrder } = req.query;
    const result = await service.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sortField: sortField || 'name',
      sortOrder: parseInt(sortOrder) || 1,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get configuration item by UUID
 * GET /api/v1/configuration_items/:uuid
 */
const getByUuid = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const item = await service.getByUuid(uuid, locale);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Configuration item not found',
      });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new configuration item
 * POST /api/v1/configuration_items
 */
const create = async (req, res, next) => {
  try {
    const item = await service.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

/**
 * Update configuration item
 * PUT /api/v1/configuration_items/:uuid
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const item = await service.update(uuid, req.body);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Configuration item not found',
      });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete configuration item
 * DELETE /api/v1/configuration_items/:uuid
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const success = await service.remove(uuid);

    if (!success) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Configuration item not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Delete multiple configuration items
 * POST /api/v1/configuration_items/delete-many
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
    next(error);
  }
};

/**
 * Get models for a specific CI type
 * GET /api/v1/configuration_items/models/:ciTypeCode
 */
const getModelsForType = async (req, res, next) => {
  try {
    const { ciTypeCode } = req.params;
    const locale = req.query.locale || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    
    const models = await service.getModelsForType(ciTypeCode, locale);
    res.json(models);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  search,
  getAll,
  getByUuid,
  create,
  update,
  remove,
  removeMany,
  getModelsForType,
};
