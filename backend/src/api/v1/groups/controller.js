const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search groups with PrimeVue filters
 * POST /api/v1/groups/search
 */
const search = async (req, res, next) => {
  try {
    const result = await service.search(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error searching groups:', error);
    next(error);
  }
};

/**
 * Get all groups
 * GET /api/v1/groups
 */
const getAll = async (req, res, next) => {
  try {
    const { page, limit, sortField, sortOrder } = req.query;
    const result = await service.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sortField: sortField || 'group_name',
      sortOrder: parseInt(sortOrder) || 1,
    });
    res.json(result);
  } catch (error) {
    logger.error('Error getting groups:', error);
    next(error);
  }
};

/**
 * Get group by UUID
 * GET /api/v1/groups/:uuid
 */
const getById = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const item = await service.getById(uuid);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Group not found',
      });
    }

    res.json(item);
  } catch (error) {
    logger.error('Error getting group:', error);
    next(error);
  }
};

/**
 * Create new group
 * POST /api/v1/groups
 */
const create = async (req, res, next) => {
  try {
    const item = await service.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    logger.error('Error creating group:', error);
    next(error);
  }
};

/**
 * Update group
 * PUT /api/v1/groups/:uuid
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const item = await service.update(uuid, req.body);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Group not found',
      });
    }

    res.json(item);
  } catch (error) {
    logger.error('Error updating group:', error);
    next(error);
  }
};

/**
 * Delete group
 * DELETE /api/v1/groups/:uuid
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const success = await service.remove(uuid);

    if (!success) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Group not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting group:', error);
    next(error);
  }
};

/**
 * Delete multiple groups
 * POST /api/v1/groups/delete-many
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
    logger.error('Error deleting groups:', error);
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
