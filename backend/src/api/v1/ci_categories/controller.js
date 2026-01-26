/**
 * CI Categories Controller
 * Handles HTTP requests for Configuration Item categories
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
 * Get all CI categories
 */
const getAll = async (req, res, next) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const locale = getLocale(req);
    
    const categories = await service.getAll({ activeOnly, locale });
    
    res.json(categories);
  } catch (error) {
    logger.error('Controller error - getAll CI categories:', error);
    next(error);
  }
};

/**
 * Get all CI categories with their CI types (for menu building)
 */
const getAllWithCiTypes = async (req, res, next) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const locale = getLocale(req);
    
    const categories = await service.getAllWithCiTypes({ activeOnly, locale });
    
    res.json(categories);
  } catch (error) {
    logger.error('Controller error - getAllWithCiTypes CI categories:', error);
    next(error);
  }
};

/**
 * Get CI types without category (for "Others" menu)
 */
const getUncategorizedCiTypes = async (req, res, next) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const locale = getLocale(req);
    
    const ciTypes = await service.getUncategorizedCiTypes({ activeOnly, locale });
    
    res.json(ciTypes);
  } catch (error) {
    logger.error('Controller error - getUncategorizedCiTypes:', error);
    next(error);
  }
};

/**
 * Get CI categories as select options
 */
const getOptions = async (req, res, next) => {
  try {
    const locale = getLocale(req);
    const options = await service.getAsOptions(locale);
    
    res.json(options);
  } catch (error) {
    logger.error('Controller error - getOptions CI categories:', error);
    next(error);
  }
};

/**
 * Get CI category by UUID
 */
const getByUuid = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const locale = getLocale(req);
    const category = await service.getByUuid(uuid, locale);
    
    if (!category) {
      return res.status(404).json({ 
        error: 'Not found',
        message: `CI category with UUID '${uuid}' not found`
      });
    }
    
    res.json(category);
  } catch (error) {
    logger.error('Controller error - getByUuid CI categories:', error);
    next(error);
  }
};

/**
 * Create a new CI category
 */
const create = async (req, res, next) => {
  try {
    const category = await service.create(req.body);
    
    res.status(201).json(category);
  } catch (error) {
    logger.error('Controller error - create CI category:', error);
    next(error);
  }
};

/**
 * Update a CI category
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const category = await service.update(uuid, req.body);
    
    res.json(category);
  } catch (error) {
    logger.error('Controller error - update CI category:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: `CI category with UUID '${uuid}' not found`
      });
    }
    
    next(error);
  }
};

/**
 * Delete a CI category
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    await service.remove(uuid);
    
    res.status(204).send();
  } catch (error) {
    logger.error('Controller error - delete CI category:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: `CI category with UUID '${uuid}' not found`
      });
    }
    
    next(error);
  }
};

/**
 * Search CI categories with PrimeVue filters
 */
const search = async (req, res, next) => {
  try {
    const locale = getLocale(req);
    const result = await service.search(req.body, locale);
    
    res.json(result);
  } catch (error) {
    logger.error('Controller error - search CI categories:', error);
    next(error);
  }
};

module.exports = {
  getAll,
  getAllWithCiTypes,
  getUncategorizedCiTypes,
  getOptions,
  getByUuid,
  create,
  update,
  remove,
  search
};
