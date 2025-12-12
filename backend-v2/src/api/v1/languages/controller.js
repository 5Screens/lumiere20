/**
 * Languages Controller
 * Handles HTTP requests for language management
 */

const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Get all languages
 */
const getAll = async (req, res, next) => {
  try {
    const activeOnly = req.query.active === 'true';
    const languages = await service.getAll({ activeOnly });
    
    res.json(languages);
  } catch (error) {
    logger.error('Controller error - getAll languages:', error);
    next(error);
  }
};

/**
 * Get active languages only (for frontend language selector)
 */
const getActive = async (req, res, next) => {
  try {
    const languages = await service.getActive();
    
    res.json(languages);
  } catch (error) {
    logger.error('Controller error - getActive languages:', error);
    next(error);
  }
};

/**
 * Get language by code
 */
const getByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const language = await service.getByCode(code);
    
    if (!language) {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Language '${code}' not found`
      });
    }
    
    res.json(language);
  } catch (error) {
    logger.error('Controller error - getByCode languages:', error);
    next(error);
  }
};

/**
 * Get language by UUID
 */
const getByUuid = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const language = await service.getByUuid(uuid);
    
    if (!language) {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Language with UUID '${uuid}' not found`
      });
    }
    
    res.json(language);
  } catch (error) {
    logger.error('Controller error - getByUuid languages:', error);
    next(error);
  }
};

/**
 * Create a new language
 */
const create = async (req, res, next) => {
  try {
    const language = await service.create(req.body);
    
    res.status(201).json(language);
  } catch (error) {
    logger.error('Controller error - create language:', error);
    next(error);
  }
};

/**
 * Update a language
 */
const update = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const language = await service.update(uuid, req.body);
    
    res.json(language);
  } catch (error) {
    logger.error('Controller error - update language:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Language with UUID '${uuid}' not found`
      });
    }
    
    next(error);
  }
};

/**
 * Toggle language active status
 */
const toggleActive = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const { is_active } = req.body;
    
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'is_active must be a boolean'
      });
    }
    
    const language = await service.toggleActive(uuid, is_active);
    
    res.json(language);
  } catch (error) {
    logger.error('Controller error - toggleActive language:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Language with UUID '${uuid}' not found`
      });
    }
    
    next(error);
  }
};

/**
 * Bulk update active status for multiple languages
 */
const bulkToggleActive = async (req, res, next) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'updates array is required'
      });
    }
    
    // Validate each update
    for (const update of updates) {
      if (!update.uuid || typeof update.is_active !== 'boolean') {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Each update must have uuid and is_active (boolean)'
        });
      }
    }
    
    const count = await service.bulkToggleActive(updates);
    
    res.json({ updated: count });
  } catch (error) {
    logger.error('Controller error - bulkToggleActive languages:', error);
    next(error);
  }
};

/**
 * Delete a language
 */
const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    await service.remove(uuid);
    
    res.status(204).send();
  } catch (error) {
    logger.error('Controller error - delete language:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Language with UUID '${uuid}' not found`
      });
    }
    
    next(error);
  }
};

module.exports = {
  getAll,
  getActive,
  getByCode,
  getByUuid,
  create,
  update,
  toggleActive,
  bulkToggleActive,
  remove
};
