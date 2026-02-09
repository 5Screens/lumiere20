const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search calendars with PrimeVue filters
 */
const search = async (req, res) => {
  try {
    const result = await service.search(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error searching calendars:', error);
    res.status(500).json({ error: 'Failed to search calendars' });
  }
};

/**
 * Get all calendars
 */
const getAll = async (req, res) => {
  try {
    const result = await service.getAll(req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error getting calendars:', error);
    res.status(500).json({ error: 'Failed to get calendars' });
  }
};

/**
 * Get calendar by UUID
 */
const getByUuid = async (req, res) => {
  try {
    const calendar = await service.getByUuid(req.params.uuid);
    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found' });
    }
    res.json(calendar);
  } catch (error) {
    logger.error('Error getting calendar:', error);
    res.status(500).json({ error: 'Failed to get calendar' });
  }
};

/**
 * Create new calendar
 */
const create = async (req, res) => {
  try {
    const calendar = await service.create(req.body);
    res.status(201).json(calendar);
  } catch (error) {
    logger.error('Error creating calendar:', error);
    res.status(500).json({ error: 'Failed to create calendar' });
  }
};

/**
 * Update calendar
 */
const update = async (req, res) => {
  try {
    const calendar = await service.update(req.params.uuid, req.body);
    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found' });
    }
    res.json(calendar);
  } catch (error) {
    logger.error('Error updating calendar:', error);
    res.status(500).json({ error: 'Failed to update calendar' });
  }
};

/**
 * Delete calendar
 */
const remove = async (req, res) => {
  try {
    const success = await service.remove(req.params.uuid);
    if (!success) {
      return res.status(404).json({ error: 'Calendar not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting calendar:', error);
    res.status(500).json({ error: 'Failed to delete calendar' });
  }
};

/**
 * Delete multiple calendars
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
    logger.error('Error deleting calendars:', error);
    res.status(500).json({ error: 'Failed to delete calendars' });
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
