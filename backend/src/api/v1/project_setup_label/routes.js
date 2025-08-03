const express = require('express');
const router = express.Router();
const projectSetupLabelController = require('./controller');
const { 
    validateUuidParam,
    validateCreateProjectSetupLabel,
    validateUpdateProjectSetupLabel
} = require('./validation');
const logger = require('../../../config/logger');

// POST /api/v1/project_setup_label - Créer un nouveau project setup label
router.post('/', validateCreateProjectSetupLabel, (req, res) => {
    logger.info('[ROUTES] POST /api/v1/project_setup_label - Route handler started');
    return projectSetupLabelController.createProjectSetupLabel(req, res);
});

// PATCH /api/v1/project_setup_label/:uuid - Mettre à jour un project setup label
router.patch('/:uuid', validateUuidParam, validateUpdateProjectSetupLabel, (req, res) => {
    logger.info(`[ROUTES] PATCH /api/v1/project_setup_label/${req.params.uuid} - Route handler started`);
    return projectSetupLabelController.patchProjectSetupLabel(req, res);
});

module.exports = router;
