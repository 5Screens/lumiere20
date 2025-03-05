const express = require('express');
const router = express.Router();
const entitiesTypesController = require('./controller');
const logger = require('../../../config/logger');

/**
 * @route GET /api/v1/entities_types
 * @desc Récupère tous les types d'entités avec leurs libellés dans la langue spécifiée
 * @param {string} langue - Code de la langue (ex: 'fr', 'en', 'es', 'pt')
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
    return entitiesTypesController.getEntityTypesByLanguage(req, res);
});

module.exports = router;
