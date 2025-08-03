const express = require('express');
const router = express.Router();
const changeSetupController = require('./controller');
const { 
    validateGetChangeSetupQuery, 
    validateGetChangeSetupByUuid, 
    validateUpdateChangeSetup, 
    validateCreateChangeSetup 
} = require('./validation');
const logger = require('../../../config/logger');

// GET /api/v1/change_setup
router.get('/', validateGetChangeSetupQuery, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/change_setup - Route handler started');
    return changeSetupController.getChangeSetup(req, res);
});

// GET /api/v1/change_setup/:uuid
router.get('/:uuid', validateGetChangeSetupByUuid, (req, res) => {
    logger.info(`[ROUTES] GET /api/v1/change_setup/${req.params.uuid} - Route handler started`);
    return changeSetupController.getChangeSetupByUuid(req, res);
});

// PATCH /api/v1/change_setup/:uuid
router.patch('/:uuid', validateUpdateChangeSetup, (req, res) => {
    logger.info(`[ROUTES] PATCH /api/v1/change_setup/${req.params.uuid} - Route handler started`);
    return changeSetupController.updateChangeSetup(req, res);
});

// POST /api/v1/change_setup
router.post('/', validateCreateChangeSetup, (req, res) => {
    logger.info('[ROUTES] POST /api/v1/change_setup - Route handler started');
    return changeSetupController.createChangeSetup(req, res);
});

module.exports = router;
