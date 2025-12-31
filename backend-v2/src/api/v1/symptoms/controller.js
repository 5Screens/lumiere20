const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search symptoms with PrimeVue filters
 */
const search = async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const result = await service.search({ ...req.body, locale });
    res.json(result);
  } catch (error) {
    logger.error('Error searching symptoms:', error);
    res.status(500).json({ error: 'Failed to search symptoms' });
  }
};

/**
 * Get all symptoms
 */
const getAll = async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const result = await service.getAll({ ...req.query, locale });
    res.json(result);
  } catch (error) {
    logger.error('Error getting symptoms:', error);
    res.status(500).json({ error: 'Failed to get symptoms' });
  }
};

/**
 * Get symptom by UUID
 */
const getByUuid = async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const symptom = await service.getByUuid(req.params.uuid, locale);
    if (!symptom) {
      return res.status(404).json({ error: 'Symptom not found' });
    }
    res.json(symptom);
  } catch (error) {
    logger.error('Error getting symptom:', error);
    res.status(500).json({ error: 'Failed to get symptom' });
  }
};

/**
 * Create new symptom
 */
const create = async (req, res) => {
  try {
    const symptom = await service.create(req.body);
    res.status(201).json(symptom);
  } catch (error) {
    logger.error('Error creating symptom:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Symptom with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to create symptom' });
  }
};

/**
 * Update symptom
 */
const update = async (req, res) => {
  try {
    const symptom = await service.update(req.params.uuid, req.body);
    if (!symptom) {
      return res.status(404).json({ error: 'Symptom not found' });
    }
    res.json(symptom);
  } catch (error) {
    logger.error('Error updating symptom:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Symptom with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to update symptom' });
  }
};

/**
 * Delete symptom
 */
const remove = async (req, res) => {
  try {
    const success = await service.remove(req.params.uuid);
    if (!success) {
      return res.status(404).json({ error: 'Symptom not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting symptom:', error);
    res.status(500).json({ error: 'Failed to delete symptom' });
  }
};

/**
 * Delete multiple symptoms
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
    logger.error('Error deleting symptoms:', error);
    res.status(500).json({ error: 'Failed to delete symptoms' });
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
