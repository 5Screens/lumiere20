const express = require('express');
const router = express.Router();
const entityController = require('./controller');
const logger = require('../../../config/logger');

// GET /api/v1/entities
router.get('/', (req, res, next) => {
    logger.info('[ROUTES] GET /api/v1/entities - Route handler started');
    
    // Vérifier si des paramètres de requête non reconnus sont présents
    const allowedParams = ['uuid', 'entity_id', 'is_active'];
    const queryParams = Object.keys(req.query);
    
    const invalidParams = queryParams.filter(param => !allowedParams.includes(param));
    if (invalidParams.length > 0) {
        logger.warn(`[ROUTES] GET /api/v1/entities - Invalid query parameters detected: ${invalidParams.join(', ')}`);
        return res.status(400).json({
            error: 'Invalid query parameters',
            invalidParams: invalidParams
        });
    }
    
    if (req.query.uuid) {
        logger.info(`[ROUTES] GET /api/v1/entities - UUID parameter detected: ${req.query.uuid}`);
        return entityController.getEntityByUuid(req, res);
    }
    
    if (req.query.entity_id) {
        logger.info(`[ROUTES] GET /api/v1/entities - entity_id parameter detected: ${req.query.entity_id}`);
        return entityController.getEntityByEntityId(req, res);
    }
    
    if (req.query.is_active === 'yes') {
        logger.info('[ROUTES] GET /api/v1/entities - is_active=yes parameter detected');
        return entityController.getActiveEntities(req, res);
    } else if (req.query.is_active && req.query.is_active !== 'yes') {
        logger.warn(`[ROUTES] GET /api/v1/entities - Invalid is_active value: ${req.query.is_active}`);
        return res.status(400).json({
            error: 'Invalid value for is_active parameter',
            message: 'The is_active parameter only accepts "yes" as a valid value'
        });
    }
    
    next();
}, entityController.getAllEntities.bind(entityController));

// GET /api/v1/entities/childentities
router.get('/childentities', (req, res) => {
    logger.info('[ROUTES] GET /api/v1/entities/childentities - Route handler started');
    return entityController.getChildEntities(req, res);
});

// POST /api/v1/entities
router.post('/', (req, res) => {
    logger.info('[ROUTES] POST /api/v1/entities - Route handler started');
    return entityController.createEntity(req, res);
});

module.exports = router;
