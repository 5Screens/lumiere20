const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search timezones with PrimeVue filters
 */
const search = async (req, res) => {
  try {
    const result = await service.search(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error searching timezones:', error);
    res.status(500).json({ error: 'Failed to search timezones' });
  }
};

/**
 * Get all timezones
 */
const getAll = async (req, res) => {
  try {
    const result = await service.getAll(req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error getting timezones:', error);
    res.status(500).json({ error: 'Failed to get timezones' });
  }
};

/**
 * Get timezone by UUID
 */
const getByUuid = async (req, res) => {
  try {
    const timezone = await service.getByUuid(req.params.uuid);
    if (!timezone) {
      return res.status(404).json({ error: 'Timezone not found' });
    }
    res.json(timezone);
  } catch (error) {
    logger.error('Error getting timezone:', error);
    res.status(500).json({ error: 'Failed to get timezone' });
  }
};

/**
 * Create new timezone
 */
const create = async (req, res) => {
  try {
    const timezone = await service.create(req.body);
    res.status(201).json(timezone);
  } catch (error) {
    logger.error('Error creating timezone:', error);
    res.status(500).json({ error: 'Failed to create timezone' });
  }
};

/**
 * Update timezone
 */
const update = async (req, res) => {
  try {
    const timezone = await service.update(req.params.uuid, req.body);
    if (!timezone) {
      return res.status(404).json({ error: 'Timezone not found' });
    }
    res.json(timezone);
  } catch (error) {
    logger.error('Error updating timezone:', error);
    res.status(500).json({ error: 'Failed to update timezone' });
  }
};

/**
 * Delete timezone
 */
const remove = async (req, res) => {
  try {
    const success = await service.remove(req.params.uuid);
    if (!success) {
      return res.status(404).json({ error: 'Timezone not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting timezone:', error);
    res.status(500).json({ error: 'Failed to delete timezone' });
  }
};

/**
 * Delete multiple timezones
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
    logger.error('Error deleting timezones:', error);
    res.status(500).json({ error: 'Failed to delete timezones' });
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
