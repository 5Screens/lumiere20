const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search user sets with PrimeVue filters
 */
const search = async (req, res) => {
  try {
    const result = await service.search(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error searching user sets:', error);
    res.status(500).json({ error: 'Failed to search user sets' });
  }
};

/**
 * Get all user sets
 */
const getAll = async (req, res) => {
  try {
    const result = await service.getAll(req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error getting user sets:', error);
    res.status(500).json({ error: 'Failed to get user sets' });
  }
};

/**
 * Get user set by UUID
 */
const getByUuid = async (req, res) => {
  try {
    const userSet = await service.getByUuid(req.params.uuid);
    if (!userSet) {
      return res.status(404).json({ error: 'User set not found' });
    }
    res.json(userSet);
  } catch (error) {
    logger.error('Error getting user set:', error);
    res.status(500).json({ error: 'Failed to get user set' });
  }
};

/**
 * Create new user set
 */
const create = async (req, res) => {
  try {
    const userSet = await service.create(req.body);
    res.status(201).json(userSet);
  } catch (error) {
    logger.error('Error creating user set:', error);
    res.status(500).json({ error: 'Failed to create user set' });
  }
};

/**
 * Update user set
 */
const update = async (req, res) => {
  try {
    const userSet = await service.update(req.params.uuid, req.body);
    if (!userSet) {
      return res.status(404).json({ error: 'User set not found' });
    }
    res.json(userSet);
  } catch (error) {
    logger.error('Error updating user set:', error);
    res.status(500).json({ error: 'Failed to update user set' });
  }
};

/**
 * Delete user set
 */
const remove = async (req, res) => {
  try {
    const success = await service.remove(req.params.uuid);
    if (!success) {
      return res.status(404).json({ error: 'User set not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting user set:', error);
    res.status(500).json({ error: 'Failed to delete user set' });
  }
};

/**
 * Delete multiple user sets
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
    logger.error('Error deleting user sets:', error);
    res.status(500).json({ error: 'Failed to delete user sets' });
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
