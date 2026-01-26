const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search locations with PrimeVue filters
 * POST /api/v1/locations/search
 */
const search = async (req, res, next) => {
  try {
    const result = await service.search(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error searching locations:', error);
    next(error);
  }
};

/**
 * Get all locations
 * GET /api/v1/locations
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
    logger.error('Error getting locations:', error);
    next(error);
  }
};

/**
 * Get location by UUID
 * GET /api/v1/locations/:uuid
 */
const getById = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const item = await service.getById(uuid);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Location not found',
      });
    }

    res.json(item);
  } catch (error) {
    logger.error('Error getting location:', error);
    next(error);
  }
};

/**
 * Create new location
 * POST /api/v1/locations
 */
const create = async (req, res, next) => {
  try {
    const item = await service.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    logger.error('Error creating location:', error);
    next(error);
  }
};

/**
 * Update location
 * PUT /api/v1/locations/:uuid
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const item = await service.update(uuid, req.body);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Location not found',
      });
    }

    res.json(item);
  } catch (error) {
    logger.error('Error updating location:', error);
    next(error);
  }
};

/**
 * Delete location
 * DELETE /api/v1/locations/:uuid
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const success = await service.remove(uuid);

    if (!success) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Location not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting location:', error);
    next(error);
  }
};

/**
 * Delete multiple locations
 * POST /api/v1/locations/delete-many
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
    logger.error('Error deleting locations:', error);
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
