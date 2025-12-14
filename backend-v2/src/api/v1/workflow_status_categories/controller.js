/**
 * Workflow Status Categories Controller
 * Handles HTTP requests for workflow status categories
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
 * Get all workflow status categories
 */
const getAll = async (req, res, next) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const locale = getLocale(req);
    
    const categories = await service.getAll({ activeOnly, locale });
    
    res.json(categories);
  } catch (error) {
    logger.error('[WORKFLOW STATUS CATEGORIES CONTROLLER] Error in getAll:', error);
    next(error);
  }
};

/**
 * Get workflow status categories as select options
 */
const getOptions = async (req, res, next) => {
  try {
    const locale = getLocale(req);
    const options = await service.getAsOptions(locale);
    
    res.json(options);
  } catch (error) {
    logger.error('[WORKFLOW STATUS CATEGORIES CONTROLLER] Error in getOptions:', error);
    next(error);
  }
};

/**
 * Get workflow status category by UUID
 */
const getByUuid = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const locale = getLocale(req);
    const category = await service.getByUuid(uuid, locale);
    
    if (!category) {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Workflow status category with UUID '${uuid}' not found`
      });
    }
    
    res.json(category);
  } catch (error) {
    logger.error('[WORKFLOW STATUS CATEGORIES CONTROLLER] Error in getByUuid:', error);
    next(error);
  }
};

/**
 * Create a new workflow status category
 */
const create = async (req, res, next) => {
  try {
    const category = await service.create(req.body);
    
    res.status(201).json(category);
  } catch (error) {
    logger.error('[WORKFLOW STATUS CATEGORIES CONTROLLER] Error in create:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'A workflow status category with this code already exists'
      });
    }
    
    next(error);
  }
};

/**
 * Update a workflow status category
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const category = await service.update(uuid, req.body);
    
    res.json(category);
  } catch (error) {
    logger.error('[WORKFLOW STATUS CATEGORIES CONTROLLER] Error in update:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Workflow status category with UUID '${req.params.uuid}' not found`
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'A workflow status category with this code already exists'
      });
    }
    
    next(error);
  }
};

/**
 * Delete a workflow status category
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    await service.remove(uuid);
    
    res.status(204).send();
  } catch (error) {
    logger.error('[WORKFLOW STATUS CATEGORIES CONTROLLER] Error in remove:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Workflow status category with UUID '${req.params.uuid}' not found`
      });
    }
    
    if (error.code === 'CATEGORY_IN_USE') {
      return res.status(409).json({ 
        error: 'Conflict',
        message: error.message,
        usedCount: error.usedCount
      });
    }
    
    next(error);
  }
};

/**
 * Search workflow status categories with PrimeVue filters
 */
const search = async (req, res, next) => {
  try {
    const locale = getLocale(req);
    const result = await service.search(req.body, locale);
    
    res.json(result);
  } catch (error) {
    logger.error('[WORKFLOW STATUS CATEGORIES CONTROLLER] Error in search:', error);
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
  search
};
