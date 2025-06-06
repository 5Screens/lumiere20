const express = require('express');
const router = express.Router();
const groupController = require('./controller');
const logger = require('../../../config/logger');

// GET /api/v1/groups/members
router.get('/members', (req, res) => {
    logger.info('[ROUTES] GET /api/v1/groups/members - Route handler started');
    return groupController.getAllGroupMembers(req, res);
});

// GET /api/v1/groups/:uuid
router.get('/:uuid', (req, res) => {
    logger.info(`[ROUTES] GET /api/v1/groups/${req.params.uuid} - Route handler started`);
    return groupController.getGroupByUuid(req, res);
});

// GET /api/v1/groups/:uuid/members
router.get('/:uuid/members', (req, res) => {
    logger.info(`[ROUTES] GET /api/v1/groups/${req.params.uuid}/members - Route handler started`);
    return groupController.getGroupMembers(req, res);
});

// GET /api/v1/groups
router.get('/', (req, res) => {
    logger.info('[ROUTES] GET /api/v1/groups - Route handler started');
    
    // Vérification des paramètres de requête
    const allowedParams = ['lang'];
    const queryParams = Object.keys(req.query);
    
    const invalidParams = queryParams.filter(param => !allowedParams.includes(param));
    if (invalidParams.length > 0) {
        logger.warn(`[ROUTES] GET /api/v1/groups - Invalid query parameters detected: ${invalidParams.join(', ')}`);
        return res.status(400).json({
            error: 'Invalid query parameters',
            invalidParams: invalidParams
        });
    }
    
    return groupController.getAllGroups(req, res);
});

// POST /api/v1/groups
router.post('/', (req, res) => {
    logger.info('[ROUTES] POST /api/v1/groups - Route handler started');
    return groupController.createGroup(req, res);
});

// PATCH /api/v1/groups/:uuid
router.patch('/:uuid', (req, res) => {
    logger.info('[ROUTES] PATCH /api/v1/groups/:uuid - Route handler started');
    
    // Validate allowed fields in request body
    const allowedFields = ['group_name', 'support_level', 'description', 'rel_supervisor', 'rel_manager', 'rel_schedule', 'email', 'phone'];
    const requestFields = Object.keys(req.body);
    
    const invalidFields = requestFields.filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
        logger.warn(`[ROUTES] PATCH /api/v1/groups/:uuid - Invalid fields detected in request body: ${invalidFields.join(', ')}`);
        return res.status(400).json({
            error: 'Invalid fields in request body',
            invalidFields: invalidFields
        });
    }

    // Add UUID from URL params to the request
    req.groupUuid = req.params.uuid;
    
    return groupController.updateGroupField(req, res);
});



module.exports = router;
