const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search causes with PrimeVue filters
 */
const search = async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const result = await service.search({ ...req.body, locale });
    res.json(result);
  } catch (error) {
    logger.error('Error searching causes:', error);
    res.status(500).json({ error: 'Failed to search causes' });
  }
};

/**
 * Get all causes
 */
const getAll = async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const result = await service.getAll({ ...req.query, locale });
    res.json(result);
  } catch (error) {
    logger.error('Error getting causes:', error);
    res.status(500).json({ error: 'Failed to get causes' });
  }
};

/**
 * Get cause by UUID
 */
const getByUuid = async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const cause = await service.getByUuid(req.params.uuid, locale);
    if (!cause) {
      return res.status(404).json({ error: 'Cause not found' });
    }
    res.json(cause);
  } catch (error) {
    logger.error('Error getting cause:', error);
    res.status(500).json({ error: 'Failed to get cause' });
  }
};

/**
 * Create new cause
 */
const create = async (req, res) => {
  try {
    const cause = await service.create(req.body);
    res.status(201).json(cause);
  } catch (error) {
    logger.error('Error creating cause:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Cause with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to create cause' });
  }
};

/**
 * Update cause
 */
const update = async (req, res) => {
  try {
    const cause = await service.update(req.params.uuid, req.body);
    if (!cause) {
      return res.status(404).json({ error: 'Cause not found' });
    }
    res.json(cause);
  } catch (error) {
    logger.error('Error updating cause:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Cause with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to update cause' });
  }
};

/**
 * Delete cause
 */
const remove = async (req, res) => {
  try {
    const success = await service.remove(req.params.uuid);
    if (!success) {
      return res.status(404).json({ error: 'Cause not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting cause:', error);
    res.status(500).json({ error: 'Failed to delete cause' });
  }
};

/**
 * Delete multiple causes
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
    logger.error('Error deleting causes:', error);
    res.status(500).json({ error: 'Failed to delete causes' });
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
