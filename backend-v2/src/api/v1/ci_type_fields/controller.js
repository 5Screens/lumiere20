/**
 * CI Type Fields Controller
 * Handles HTTP requests for CI type extended fields
 */

const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Get locale from request (header or query param)
 */
const getLocale = (req) => {
  const headerLocale = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
  return req.query.locale || headerLocale || 'en';
};

/**
 * Get all fields for a CI type
 */
const getByTypeUuid = async (req, res) => {
  try {
    const { ciTypeUuid } = req.params;
    const locale = getLocale(req);
    const fields = await service.getByTypeUuid(ciTypeUuid, locale);
    res.json(fields);
  } catch (error) {
    logger.error('Controller error - getByTypeUuid:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch CI type fields'
    });
  }
};

/**
 * Get a single field by UUID
 */
const getByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const locale = getLocale(req);
    const field = await service.getByUuid(uuid, locale);
    
    if (!field) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Field not found'
      });
    }
    
    res.json(field);
  } catch (error) {
    logger.error('Controller error - getByUuid:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch field'
    });
  }
};

/**
 * Create a new field
 */
const create = async (req, res) => {
  try {
    const field = await service.create(req.body);
    res.status(201).json(field);
  } catch (error) {
    logger.error('Controller error - create field:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'A field with this name already exists for this CI type'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create field'
    });
  }
};

/**
 * Update a field
 */
const update = async (req, res) => {
  try {
    const { uuid } = req.params;
    const field = await service.update(uuid, req.body);
    res.json(field);
  } catch (error) {
    logger.error('Controller error - update field:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Field not found'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update field'
    });
  }
};

/**
 * Delete a field
 */
const remove = async (req, res) => {
  try {
    const { uuid } = req.params;
    await service.remove(uuid);
    res.status(204).send();
  } catch (error) {
    logger.error('Controller error - delete field:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Field not found'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete field'
    });
  }
};

/**
 * Delete multiple fields
 */
const removeMany = async (req, res) => {
  try {
    const { uuids } = req.body;
    
    if (!uuids || !Array.isArray(uuids) || uuids.length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'uuids array is required'
      });
    }
    
    const count = await service.removeMany(uuids);
    res.json({ deleted: count });
  } catch (error) {
    logger.error('Controller error - delete many fields:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete fields'
    });
  }
};

/**
 * Reorder fields
 */
const reorder = async (req, res) => {
  try {
    const { ciTypeUuid } = req.params;
    const { orderedUuids } = req.body;
    
    if (!orderedUuids || !Array.isArray(orderedUuids)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'orderedUuids array is required'
      });
    }
    
    await service.reorder(ciTypeUuid, orderedUuids);
    res.json({ success: true });
  } catch (error) {
    logger.error('Controller error - reorder fields:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to reorder fields'
    });
  }
};

/**
 * Toggle field visibility
 */
const toggleVisibility = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { property } = req.body;
    
    if (!['show_in_form', 'show_in_table'].includes(property)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'property must be show_in_form or show_in_table'
      });
    }
    
    const field = await service.toggleVisibility(uuid, property);
    res.json(field);
  } catch (error) {
    logger.error('Controller error - toggle visibility:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to toggle field visibility'
    });
  }
};

module.exports = {
  getByTypeUuid,
  getByUuid,
  create,
  update,
  remove,
  removeMany,
  reorder,
  toggleVisibility
};
