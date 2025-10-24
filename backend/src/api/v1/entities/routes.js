const express = require('express');
const router = express.Router();
const entityController = require('./controller');
const logger = require('../../../config/logger');

// GET /api/v1/entities/:uuid
router.get('/:uuid', (req, res) => {
    logger.info(`[ROUTES] GET /api/v1/entities/${req.params.uuid} - Route handler started`);
    return entityController.getEntityByUuid(req, res);
});

// GET /api/v1/entities
router.get('/', (req, res, next) => {
    logger.info('[ROUTES] GET /api/v1/entities - Route handler started');
    
    // Check for unrecognized query parameters
    const allowedParams = ['entity_id', 'is_active', 'lang'];
    const queryParams = Object.keys(req.query);
    
    const invalidParams = queryParams.filter(param => !allowedParams.includes(param));
    if (invalidParams.length > 0) {
        logger.warn(`[ROUTES] GET /api/v1/entities - Invalid query parameters detected: ${invalidParams.join(', ')}`);
        return res.status(400).json({
            error: 'Invalid query parameters',
            invalidParams: invalidParams
        });
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

// GET /api/v1/entities/:uuid/relations/count
router.get('/:uuid/relations/count', (req, res) => {
    logger.info(`[ROUTES] GET /api/v1/entities/${req.params.uuid}/relations/count - Route handler started`);
    return entityController.getEntityRelationsCount(req, res);
});

// POST /api/v1/entities
router.post('/', (req, res) => {
    logger.info('[ROUTES] POST /api/v1/entities - Route handler started');
    return entityController.createEntity(req, res);
});

// PATCH /api/v1/entities/:uuid
router.patch('/:uuid', (req, res) => {
    logger.info('[ROUTES] PATCH /api/v1/entities/:uuid - Route handler started');
    
    // Validate allowed fields in request body
    const allowedFields = ['name', 'entity_id', 'external_id', 'entity_type', 'rel_headquarters_location', 'is_active', 'parent_uuid'];
    const requestFields = Object.keys(req.body);
    
    const invalidFields = requestFields.filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
        logger.warn(`[ROUTES] PATCH /api/v1/entities/:uuid - Invalid fields detected in request body: ${invalidFields.join(', ')}`);
        return res.status(400).json({
            error: 'Invalid fields in request body',
            invalidFields: invalidFields
        });
    }

    // Add UUID from URL params to the request
    req.entityUuid = req.params.uuid;
    
    return entityController.updateEntityField(req, res);
});

module.exports = router;
