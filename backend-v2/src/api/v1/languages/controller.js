/**
 * Languages Controller
 * Handles HTTP requests for language management
 */

const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Get all languages
 */
const getAll = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const languages = await service.getAll({ activeOnly });
    
    res.json(languages);
  } catch (error) {
    logger.error('Controller error - getAll languages:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch languages'
    });
  }
};

/**
 * Get active languages only (for frontend language selector)
 */
const getActive = async (req, res) => {
  try {
    const languages = await service.getActive();
    
    res.json(languages);
  } catch (error) {
    logger.error('Controller error - getActive languages:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch active languages'
    });
  }
};

/**
 * Get language by code
 */
const getByCode = async (req, res) => {
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
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch language'
    });
  }
};

/**
 * Get language by UUID
 */
const getByUuid = async (req, res) => {
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
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch language'
    });
  }
};

/**
 * Create a new language
 */
const create = async (req, res) => {
  try {
    const language = await service.create(req.body);
    
    res.status(201).json(language);
  } catch (error) {
    logger.error('Controller error - create language:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'A language with this code already exists'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create language'
    });
  }
};

/**
 * Update a language
 */
const update = async (req, res) => {
  try {
    const { uuid } = req.params;
    const language = await service.update(uuid, req.body);
    
    res.json(language);
  } catch (error) {
    logger.error('Controller error - update language:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Language not found'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update language'
    });
  }
};

/**
 * Toggle language active status
 */
const toggleActive = async (req, res) => {
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
        message: 'Language not found'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to toggle language status'
    });
  }
};

/**
 * Bulk update active status for multiple languages
 */
const bulkToggleActive = async (req, res) => {
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
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to bulk update languages'
    });
  }
};

/**
 * Delete a language
 */
const remove = async (req, res) => {
  try {
    const { uuid } = req.params;
    await service.remove(uuid);
    
    res.status(204).send();
  } catch (error) {
    logger.error('Controller error - delete language:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Language not found'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete language'
    });
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
