const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search holidays with PrimeVue filters
 */
const search = async (req, res) => {
  try {
    const result = await service.search(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error searching holidays:', error);
    res.status(500).json({ error: 'Failed to search holidays' });
  }
};

/**
 * Get all holidays
 */
const getAll = async (req, res) => {
  try {
    const result = await service.getAll(req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error getting holidays:', error);
    res.status(500).json({ error: 'Failed to get holidays' });
  }
};

/**
 * Get holiday by UUID
 */
const getByUuid = async (req, res) => {
  try {
    const holiday = await service.getByUuid(req.params.uuid);
    if (!holiday) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    res.json(holiday);
  } catch (error) {
    logger.error('Error getting holiday:', error);
    res.status(500).json({ error: 'Failed to get holiday' });
  }
};

/**
 * Create new holiday
 */
const create = async (req, res) => {
  try {
    const holiday = await service.create(req.body);
    res.status(201).json(holiday);
  } catch (error) {
    logger.error('Error creating holiday:', error);
    res.status(500).json({ error: 'Failed to create holiday' });
  }
};

/**
 * Update holiday
 */
const update = async (req, res) => {
  try {
    const holiday = await service.update(req.params.uuid, req.body);
    if (!holiday) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    res.json(holiday);
  } catch (error) {
    logger.error('Error updating holiday:', error);
    res.status(500).json({ error: 'Failed to update holiday' });
  }
};

/**
 * Delete holiday
 */
const remove = async (req, res) => {
  try {
    const success = await service.remove(req.params.uuid);
    if (!success) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting holiday:', error);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
};

/**
 * Delete multiple holidays
 */
const removeMany = async (req, res) => {
  try {
    const { uuids } = req.body;
    if (!Array.isArray(uuids) || uuids.length === 0) {
      return res.status(400).json({ error: 'uuids array is required' });
    }
    const count = await service.removeMany(uuids);
    res.json({ deleted: count });
  } catch (error) {
    logger.error('Error deleting holidays:', error);
    res.status(500).json({ error: 'Failed to delete holidays' });
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
};
