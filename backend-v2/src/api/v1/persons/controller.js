const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search persons with PrimeVue filters
 * POST /api/v1/persons/search
 */
const search = async (req, res, next) => {
  try {
    const result = await service.search(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error searching persons:', error);
    next(error);
  }
};

/**
 * Get all persons
 * GET /api/v1/persons
 */
const getAll = async (req, res, next) => {
  try {
    const { page, limit, sortField, sortOrder } = req.query;
    const result = await service.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sortField: sortField || 'last_name',
      sortOrder: parseInt(sortOrder) || 1,
    });
    res.json(result);
  } catch (error) {
    logger.error('Error getting persons:', error);
    next(error);
  }
};

/**
 * Get person by UUID
 * GET /api/v1/persons/:uuid
 */
const getById = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const item = await service.getById(uuid);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Person not found',
      });
    }

    res.json(item);
  } catch (error) {
    logger.error('Error getting person:', error);
    next(error);
  }
};

/**
 * Create new person
 * POST /api/v1/persons
 */
const create = async (req, res, next) => {
  try {
    const item = await service.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    logger.error('Error creating person:', error);
    next(error);
  }
};

/**
 * Update person
 * PUT /api/v1/persons/:uuid
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const item = await service.update(uuid, req.body);

    if (!item) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Person not found',
      });
    }

    res.json(item);
  } catch (error) {
    logger.error('Error updating person:', error);
    next(error);
  }
};

/**
 * Delete person
 * DELETE /api/v1/persons/:uuid
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const success = await service.remove(uuid);

    if (!success) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Person not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting person:', error);
    next(error);
  }
};

/**
 * Delete multiple persons
 * POST /api/v1/persons/delete-many
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
    logger.error('Error deleting persons:', error);
    next(error);
  }
};

/**
 * Reset password for a person (admin action)
 * POST /api/v1/persons/:uuid/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const { newPassword } = req.body;
    
    // Get admin UUID from authenticated user
    const adminUuid = req.user?.uuid;
    
    if (!adminUuid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const result = await service.resetPassword(uuid, newPassword, adminUuid);
    
    logger.info(`Password reset for user ${uuid} by admin ${adminUuid}`);
    
    res.json({ 
      message: 'Password reset successfully',
      user: result
    });
  } catch (error) {
    logger.error('Error resetting password:', error);
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
  resetPassword,
};
