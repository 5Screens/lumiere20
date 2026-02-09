const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search commitments with PrimeVue filters
 */
const search = async (req, res) => {
  try {
    const result = await service.search(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error searching commitments:', error);
    res.status(500).json({ error: 'Failed to search commitments' });
  }
};

/**
 * Get all commitments
 */
const getAll = async (req, res) => {
  try {
    const result = await service.getAll(req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error getting commitments:', error);
    res.status(500).json({ error: 'Failed to get commitments' });
  }
};

/**
 * Get commitment by UUID
 */
const getByUuid = async (req, res) => {
  try {
    const commitment = await service.getByUuid(req.params.uuid);
    if (!commitment) {
      return res.status(404).json({ error: 'Commitment not found' });
    }
    res.json(commitment);
  } catch (error) {
    logger.error('Error getting commitment:', error);
    res.status(500).json({ error: 'Failed to get commitment' });
  }
};

/**
 * Create new commitment
 */
const create = async (req, res) => {
  try {
    const commitment = await service.create(req.body);
    res.status(201).json(commitment);
  } catch (error) {
    logger.error('Error creating commitment:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This SLA is already linked to this service offering' });
    }
    res.status(500).json({ error: 'Failed to create commitment' });
  }
};

/**
 * Update commitment
 */
const update = async (req, res) => {
  try {
    const commitment = await service.update(req.params.uuid, req.body);
    if (!commitment) {
      return res.status(404).json({ error: 'Commitment not found' });
    }
    res.json(commitment);
  } catch (error) {
    logger.error('Error updating commitment:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This SLA is already linked to this service offering' });
    }
    res.status(500).json({ error: 'Failed to update commitment' });
  }
};

/**
 * Delete commitment
 */
const remove = async (req, res) => {
  try {
    const success = await service.remove(req.params.uuid);
    if (!success) {
      return res.status(404).json({ error: 'Commitment not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting commitment:', error);
    res.status(500).json({ error: 'Failed to delete commitment' });
  }
};

/**
 * Delete multiple commitments
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
    logger.error('Error deleting commitments:', error);
    res.status(500).json({ error: 'Failed to delete commitments' });
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
