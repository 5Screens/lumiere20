/**
 * Object Setup Controller
 * Handles HTTP requests for business objects metadata configuration
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
 * Get all object setup records
 */
const getAll = async (req, res, next) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const locale = getLocale(req);
    const objectType = req.query.object_type || null;
    
    const records = await service.getAll({ activeOnly, locale, objectType });
    
    res.json(records);
  } catch (error) {
    logger.error('Controller error - getAll object setup:', error);
    next(error);
  }
};

/**
 * Get object setup records as select options
 */
const getOptions = async (req, res, next) => {
  try {
    const locale = getLocale(req);
    const { object_type, metadata } = req.query;
    
    const options = await service.getAsOptions({ locale, objectType: object_type, metadata });
    
    res.json(options);
  } catch (error) {
    logger.error('Controller error - getOptions object setup:', error);
    next(error);
  }
};

/**
 * Get object setup by UUID
 */
const getByUuid = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const locale = getLocale(req);
    const record = await service.getByUuid(uuid, locale);
    
    if (!record) {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Object setup with UUID '${uuid}' not found`
      });
    }
    
    res.json(record);
  } catch (error) {
    logger.error('Controller error - getByUuid object setup:', error);
    next(error);
  }
};

/**
 * Create a new object setup record
 */
const create = async (req, res, next) => {
  try {
    const record = await service.create(req.body);
    
    res.status(201).json(record);
  } catch (error) {
    logger.error('Controller error - create object setup:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An object setup with this object_type, metadata, and code already exists'
      });
    }
    
    next(error);
  }
};

/**
 * Update an object setup record
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const record = await service.update(uuid, req.body);
    
    res.json(record);
  } catch (error) {
    logger.error('Controller error - update object setup:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Object setup with UUID '${req.params.uuid}' not found`
      });
    }
    
    next(error);
  }
};

/**
 * Delete an object setup record
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    await service.remove(uuid);
    
    res.status(204).send();
  } catch (error) {
    logger.error('Controller error - delete object setup:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Object setup with UUID '${req.params.uuid}' not found`
      });
    }
    
    next(error);
  }
};

/**
 * Search object setup records with PrimeVue filters
 */
const search = async (req, res, next) => {
  try {
    const locale = getLocale(req);
    const result = await service.search(req.body, locale);
    
    res.json(result);
  } catch (error) {
    logger.error('Controller error - search object setup:', error);
    next(error);
  }
};

/**
 * Get distinct object types (for filter dropdown)
 */
const getObjectTypes = async (req, res, next) => {
  try {
    const types = await service.getObjectTypes();
    res.json(types);
  } catch (error) {
    logger.error('Controller error - getObjectTypes:', error);
    next(error);
  }
};

/**
 * Get distinct metadata types for a given object_type
 */
const getMetadataTypes = async (req, res, next) => {
  try {
    const { object_type } = req.query;
    if (!object_type) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'object_type query parameter is required'
      });
    }
    
    const types = await service.getMetadataTypes(object_type);
    res.json(types);
  } catch (error) {
    logger.error('Controller error - getMetadataTypes:', error);
    next(error);
  }
};

module.exports = {
  getAll,
  getOptions,
  getByUuid,
  create,
  update,
  remove,
  search,
  getObjectTypes,
  getMetadataTypes
};
