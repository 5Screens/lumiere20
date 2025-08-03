const express = require('express');
const router = express.Router();
const projectSetupController = require('./controller');
const { 
    validateGetProjectSetupQuery,
    validateUuidParam,
    validateCreateProjectSetup,
    validateUpdateProjectSetup
} = require('./validation');
const logger = require('../../../config/logger');

// GET /api/v1/project_setup - Récupérer tous les project setup
router.get('/', validateGetProjectSetupQuery, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/project_setup - Route handler started');
    return projectSetupController.getAllProjectSetup(req, res);
});

// GET /api/v1/project_setup/:uuid - Récupérer un project setup par UUID
router.get('/:uuid', validateUuidParam, (req, res) => {
    logger.info(`[ROUTES] GET /api/v1/project_setup/${req.params.uuid} - Route handler started`);
    return projectSetupController.getProjectSetupByUuid(req, res);
});

// POST /api/v1/project_setup - Créer un nouveau project setup
router.post('/', validateCreateProjectSetup, (req, res) => {
    logger.info('[ROUTES] POST /api/v1/project_setup - Route handler started');
    return projectSetupController.createProjectSetup(req, res);
});

// PATCH /api/v1/project_setup/:uuid - Mettre à jour un project setup
router.patch('/:uuid', validateUuidParam, validateUpdateProjectSetup, (req, res) => {
    logger.info(`[ROUTES] PATCH /api/v1/project_setup/${req.params.uuid} - Route handler started`);
    return projectSetupController.updateProjectSetup(req, res);
});

// Route legacy pour compatibilité
router.get('/legacy', validateGetProjectSetupQuery, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/project_setup/legacy - Legacy route handler started');
    return projectSetupController.getProjectSetup(req, res);
});

module.exports = router;
