const express = require('express');
const router = express.Router();
const incidentSetupController = require('./controller');
const validation = require('./validation');
const logger = require('../../../config/logger');

/**
 * GET /api/v1/incident_setup
 * Récupère tous les incident_setup_codes avec leurs traductions
 */
router.get('/', 
    validation.validateGetAllIncidentSetup,
    (req, res, next) => {
        logger.info(`[ROUTES] GET /incident_setup - Request received with query: ${JSON.stringify(req.query)}`);
        next();
    },
    incidentSetupController.getAllIncidentSetup
);

/**
 * GET /api/v1/incident_setup/:uuid
 * Récupère un incident_setup_code par UUID
 */
router.get('/:uuid', 
    validation.validateGetIncidentSetupByUuid,
    (req, res, next) => {
        logger.info(`[ROUTES] GET /incident_setup/${req.params.uuid} - Request received with query: ${JSON.stringify(req.query)}`);
        next();
    },
    incidentSetupController.getIncidentSetupByUuid
);

/**
 * POST /api/v1/incident_setup
 * Crée un nouveau incident_setup_code
 */
router.post('/', 
    validation.validateCreateIncidentSetup,
    (req, res, next) => {
        logger.info(`[ROUTES] POST /incident_setup - Request received with body code: ${req.body.code}`);
        next();
    },
    incidentSetupController.createIncidentSetup
);

/**
 * PATCH /api/v1/incident_setup/:uuid
 * Met à jour un incident_setup_code
 */
router.patch('/:uuid', 
    validation.validateUpdateIncidentSetup,
    (req, res, next) => {
        logger.info(`[ROUTES] PATCH /incident_setup/${req.params.uuid} - Request received`);
        next();
    },
    incidentSetupController.updateIncidentSetup
);

/**
 * Route legacy pour compatibilité
 */
router.get('/legacy', 
    validation.validateGetAllIncidentSetup,
    (req, res, next) => {
        logger.info(`[ROUTES] GET /incident_setup/legacy - Legacy request received`);
        next();
    },
    incidentSetupController.getIncidentSetup
);

module.exports = router;
