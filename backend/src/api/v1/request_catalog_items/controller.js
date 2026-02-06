const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search request catalog items with PrimeVue filters
 */
const search = async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const result = await service.search({ ...req.body, locale });
    res.json(result);
  } catch (error) {
    logger.error('Error searching request catalog items:', error);
    res.status(500).json({ error: 'Failed to search request catalog items' });
  }
};

/**
 * Get all request catalog items
 */
const getAll = async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const result = await service.getAll({ ...req.query, locale });
    res.json(result);
  } catch (error) {
    logger.error('Error getting request catalog items:', error);
    res.status(500).json({ error: 'Failed to get request catalog items' });
  }
};

/**
 * Get request catalog item by UUID
 */
const getByUuid = async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const item = await service.getByUuid(req.params.uuid, locale);
    if (!item) {
      return res.status(404).json({ error: 'Request catalog item not found' });
    }
    res.json(item);
  } catch (error) {
    logger.error('Error getting request catalog item:', error);
    res.status(500).json({ error: 'Failed to get request catalog item' });
  }
};

/**
 * Create new request catalog item
 */
const create = async (req, res) => {
  try {
    const item = await service.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    logger.error('Error creating request catalog item:', error);
    res.status(500).json({ error: 'Failed to create request catalog item' });
  }
};

/**
 * Update request catalog item
 */
const update = async (req, res) => {
  try {
    const item = await service.update(req.params.uuid, req.body);
    if (!item) {
      return res.status(404).json({ error: 'Request catalog item not found' });
    }
    res.json(item);
  } catch (error) {
    logger.error('Error updating request catalog item:', error);
    res.status(500).json({ error: 'Failed to update request catalog item' });
  }
};

/**
 * Delete request catalog item
 */
const remove = async (req, res) => {
  try {
    const success = await service.remove(req.params.uuid);
    if (!success) {
      return res.status(404).json({ error: 'Request catalog item not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting request catalog item:', error);
    res.status(500).json({ error: 'Failed to delete request catalog item' });
  }
};

/**
 * Delete multiple request catalog items
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
    logger.error('Error deleting request catalog items:', error);
    res.status(500).json({ error: 'Failed to delete request catalog items' });
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
