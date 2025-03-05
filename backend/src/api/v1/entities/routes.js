const express = require('express');
const router = express.Router();
const entityController = require('./controller');
const logger = require('../../../config/logger');

// GET /api/v1/entities
router.get('/', (req, res, next) => {
    logger.info('[ROUTES] GET /api/v1/entities - Route handler started');
    
    if (req.query.uuid) {
        logger.info(`[ROUTES] GET /api/v1/entities - UUID parameter detected: ${req.query.uuid}`);
        return entityController.getEntityByUuid(req, res);
    }
    
    if (req.query.entity_id) {
        logger.info(`[ROUTES] GET /api/v1/entities - entity_id parameter detected: ${req.query.entity_id}`);
        return entityController.getEntityByEntityId(req, res);
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
