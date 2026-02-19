const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Search roles with PrimeVue filters
 */
const search = async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const result = await service.search({ ...req.body, locale });
    res.json(result);
  } catch (error) {
    logger.error('Error searching roles:', error);
    res.status(500).json({ error: 'Failed to search roles' });
  }
};

/**
 * Get all roles
 */
const getAll = async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const result = await service.getAll({ ...req.query, locale });
    res.json(result);
  } catch (error) {
    logger.error('Error getting roles:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
};

/**
 * Get role by UUID
 */
const getByUuid = async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const role = await service.getByUuid(req.params.uuid, locale);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    logger.error('Error getting role:', error);
    res.status(500).json({ error: 'Failed to get role' });
  }
};

/**
 * Create new role
 */
const create = async (req, res) => {
  try {
    const role = await service.create(req.body);
    res.status(201).json(role);
  } catch (error) {
    logger.error('Error creating role:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Role with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to create role' });
  }
};

/**
 * Update role
 */
const update = async (req, res) => {
  try {
    const role = await service.update(req.params.uuid, req.body);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    logger.error('Error updating role:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Role with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to update role' });
  }
};

/**
 * Delete role
 */
const remove = async (req, res) => {
  try {
    const success = await service.remove(req.params.uuid);
    if (!success) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};

/**
 * Delete multiple roles
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
    logger.error('Error deleting roles:', error);
    res.status(500).json({ error: 'Failed to delete roles' });
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
