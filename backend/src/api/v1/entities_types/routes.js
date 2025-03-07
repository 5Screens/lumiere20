const express = require('express');
const router = express.Router();
const entitiesTypesController = require('./controller');
const logger = require('../../../config/logger');

/**
 * @route GET /api/v1/entities_types
 * @desc Retrieves all entity types with their labels in the specified language
 * @param {string} langue - Language code (ex: 'fr', 'en', 'es', 'pt')
 * @param {string} [toSelect] - If 'yes', formats output for select field usage
 * @access Public
 */
router.get('/', (req, res) => {
    logger.info('[ROUTES] GET /api/v1/entities_types - Route handler started');
    
    if (!req.query.langue) {
        logger.warn('[ROUTES] GET /api/v1/entities_types - Missing langue parameter');
        return res.status(400).json({
            success: false,
            message: 'Le paramètre langue est requis'
        });
    }
    
    logger.info(`[ROUTES] GET /api/v1/entities_types - langue parameter detected: ${req.query.langue}`);
    
    const { toSelect } = req.query;
    if (toSelect === 'yes') {
        logger.info('[ROUTES] GET /api/v1/entities_types - toSelect format requested');
        return entitiesTypesController.getEntityTypesForSelect(req, res);
    }
    
    return entitiesTypesController.getEntityTypesByLanguage(req, res);
});

module.exports = router;
