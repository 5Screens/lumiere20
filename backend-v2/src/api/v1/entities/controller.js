const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search entities with PrimeVue filters
 * POST /api/v1/entities/search
 */
const search = async (req, res, next) => {
  try {
    const result = await service.search(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error searching entities:', error);
    next(error);
  }
};

/**
 * Get all entities
 * GET /api/v1/entities
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
    logger.error('Error getting entities:', error);
    next(error);
  }
};

/**
 * Get entity by UUID
 * GET /api/v1/entities/:uuid
 */
const getById = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const item = await service.getById(uuid);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Entity not found',
      });
    }

    res.json(item);
  } catch (error) {
    logger.error('Error getting entity:', error);
    next(error);
  }
};

/**
 * Create new entity
 * POST /api/v1/entities
 */
const create = async (req, res, next) => {
  try {
    const item = await service.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    logger.error('Error creating entity:', error);
    next(error);
  }
};

/**
 * Update entity
 * PUT /api/v1/entities/:uuid
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const item = await service.update(uuid, req.body);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Entity not found',
      });
    }

    res.json(item);
  } catch (error) {
    logger.error('Error updating entity:', error);
    next(error);
  }
};

/**
 * Delete entity
 * DELETE /api/v1/entities/:uuid
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const success = await service.remove(uuid);

    if (!success) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Entity not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting entity:', error);
    next(error);
  }
};

/**
 * Delete multiple entities
 * POST /api/v1/entities/delete-many
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
    logger.error('Error deleting entities:', error);
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
};
