const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search audit changes with PrimeVue filters
 * POST /api/v1/audit/search
 */
const search = async (req, res, next) => {
  try {
    const result = await service.search(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error searching audit changes:', error);
    next(error);
  }
};

/**
 * Get all audit changes
 * GET /api/v1/audit
 */
const getAll = async (req, res, next) => {
  try {
    const { page, limit, sortField, sortOrder } = req.query;
    const result = await service.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sortField: sortField || 'event_date',
      sortOrder: parseInt(sortOrder) || -1,
    });
    res.json(result);
  } catch (error) {
    logger.error('Error getting audit changes:', error);
    next(error);
  }
};

/**
 * Get audit changes for a specific object
 * GET /api/v1/audit/object/:uuid
 */
const getByObjectUuid = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const items = await service.getByObjectUuid(uuid);
    res.json(items);
  } catch (error) {
    logger.error('Error getting audit changes for object:', error);
    next(error);
  }
};

module.exports = {
  search,
  getAll,
  getByObjectUuid,
};
