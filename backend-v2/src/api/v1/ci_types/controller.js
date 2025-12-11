/**
 * CI Types Controller
 * Handles HTTP requests for Configuration Item types
 */

const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Get locale from request (header or query param)
 */
const getLocale = (req) => {
  // Check Accept-Language header first, then query param
  const headerLocale = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
  return req.query.locale || headerLocale || 'en';
};

/**
 * Get all CI types
 */
const getAll = async (req, res) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const locale = getLocale(req);
    
    const ciTypes = await service.getAll({ activeOnly, locale });
    
    res.json(ciTypes);
  } catch (error) {
    logger.error('Controller error - getAll CI types:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch CI types'
    });
  }
};

/**
 * Get CI types as select options
 */
const getOptions = async (req, res) => {
  try {
    const locale = getLocale(req);
    const options = await service.getAsOptions(locale);
    
    res.json(options);
  } catch (error) {
    logger.error('Controller error - getOptions CI types:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch CI type options'
    });
  }
};

/**
 * Get CI type by UUID
 */
const getByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const locale = getLocale(req);
    const ciType = await service.getByUuid(uuid, locale);
    
    if (!ciType) {
      return res.status(404).json({ 
        error: 'Not found',
        message: `CI type with UUID '${uuid}' not found`
      });
    }
    
    res.json(ciType);
  } catch (error) {
    logger.error('Controller error - getByUuid CI types:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch CI type'
    });
  }
};

/**
 * Create a new CI type
 */
const create = async (req, res) => {
  try {
    const ciType = await service.create(req.body);
    
    res.status(201).json(ciType);
  } catch (error) {
    logger.error('Controller error - create CI type:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'A CI type with this code already exists'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create CI type'
    });
  }
};

/**
 * Update a CI type
 */
const update = async (req, res) => {
  try {
    const { uuid } = req.params;
    const ciType = await service.update(uuid, req.body);
    
    res.json(ciType);
  } catch (error) {
    logger.error('Controller error - update CI type:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'CI type not found'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update CI type'
    });
  }
};

/**
 * Delete a CI type
 */
const remove = async (req, res) => {
  try {
    const { uuid } = req.params;
    await service.remove(uuid);
    
    res.status(204).send();
  } catch (error) {
    logger.error('Controller error - delete CI type:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'CI type not found'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete CI type'
    });
  }
};

/**
 * Search CI types with PrimeVue filters
 */
const search = async (req, res) => {
  try {
    const locale = getLocale(req);
    const result = await service.search(req.body, locale);
    
    res.json(result);
  } catch (error) {
    logger.error('Controller error - search CI types:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to search CI types'
    });
  }
};

/**
 * Get extended fields for a CI type by code
 */
const getFields = async (req, res) => {
  try {
    const { code } = req.params;
    const fields = await service.getFieldsByCode(code);
    
    // Parse options_source JSON for select fields
    const parsedFields = fields.map(field => ({
      ...field,
      options: field.options_source ? JSON.parse(field.options_source) : null
    }));
    
    res.json(parsedFields);
  } catch (error) {
    logger.error('Controller error - getFields CI type:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch CI type fields'
    });
  }
};

/**
 * Delete multiple CI types
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
    logger.error('Controller error - delete many CI types:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete CI types'
    });
  }
};

module.exports = {
  getAll,
  getOptions,
  getByUuid,
  getFields,
  create,
  update,
  remove,
  search,
  removeMany
};
