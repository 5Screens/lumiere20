const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search SLAs with PrimeVue filters
 */
const search = async (req, res) => {
  try {
    const result = await service.search(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error searching SLAs:', error);
    res.status(500).json({ error: 'Failed to search SLAs' });
  }
};

/**
 * Get all SLAs
 */
const getAll = async (req, res) => {
  try {
    const result = await service.getAll(req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error getting SLAs:', error);
    res.status(500).json({ error: 'Failed to get SLAs' });
  }
};

/**
 * Get SLA by UUID
 */
const getByUuid = async (req, res) => {
  try {
    const sla = await service.getByUuid(req.params.uuid);
    if (!sla) {
      return res.status(404).json({ error: 'SLA not found' });
    }
    res.json(sla);
  } catch (error) {
    logger.error('Error getting SLA:', error);
    res.status(500).json({ error: 'Failed to get SLA' });
  }
};

/**
 * Create new SLA
 */
const create = async (req, res) => {
  try {
    const sla = await service.create(req.body);
    res.status(201).json(sla);
  } catch (error) {
    logger.error('Error creating SLA:', error);
    res.status(500).json({ error: 'Failed to create SLA' });
  }
};

/**
 * Update SLA
 */
const update = async (req, res) => {
  try {
    const sla = await service.update(req.params.uuid, req.body);
    if (!sla) {
      return res.status(404).json({ error: 'SLA not found' });
    }
    res.json(sla);
  } catch (error) {
    logger.error('Error updating SLA:', error);
    res.status(500).json({ error: 'Failed to update SLA' });
  }
};

/**
 * Delete SLA
 */
const remove = async (req, res) => {
  try {
    const success = await service.remove(req.params.uuid);
    if (!success) {
      return res.status(404).json({ error: 'SLA not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting SLA:', error);
    res.status(500).json({ error: 'Failed to delete SLA' });
  }
};

/**
 * Delete multiple SLAs
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
    logger.error('Error deleting SLAs:', error);
    res.status(500).json({ error: 'Failed to delete SLAs' });
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
