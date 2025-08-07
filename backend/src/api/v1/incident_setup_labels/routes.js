const express = require('express');
const router = express.Router();
const incidentSetupLabelsController = require('./controller');
const validation = require('./validation');
const logger = require('../../../config/logger');

/**
 * POST /api/v1/incident_setup_labels
 * Crée un nouveau label pour incident_setup
 */
router.post('/', 
    validation.validateCreateIncidentSetupLabel,
    (req, res, next) => {
        logger.info(`[ROUTES] POST /incident_setup_labels - Request received for parent_uuid: ${req.body.parent_uuid}`);
        next();
    },
    incidentSetupLabelsController.createIncidentSetupLabel
);

/**
 * PATCH /api/v1/incident_setup_labels/:uuid
 * Met à jour un label d'incident_setup
 */
router.patch('/:uuid', 
    validation.validatePatchIncidentSetupLabel,
    (req, res, next) => {
        logger.info(`[ROUTES] PATCH /incident_setup_labels/${req.params.uuid} - Request received`);
        next();
    },
    incidentSetupLabelsController.patchIncidentSetupLabel
);

module.exports = router;
