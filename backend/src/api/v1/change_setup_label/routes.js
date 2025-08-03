const express = require('express');
const router = express.Router();
const changeSetupLabelsController = require('./controller');
const { 
    validateCreateChangeSetupLabel,
    validatePatchChangeSetupLabel
} = require('./validation');
const logger = require('../../../config/logger');

// POST /api/v1/change_setup_label - Créer un nouveau change_setup_label
router.post('/', validateCreateChangeSetupLabel, (req, res) => {
    logger.info('[ROUTES] POST /api/v1/change_setup_label - Route handler started');
    return changeSetupLabelsController.createChangeSetupLabel(req, res);
});

// PATCH /api/v1/change_setup_label/:uuid - Mettre à jour un change_setup_label
router.patch('/:uuid', validatePatchChangeSetupLabel, (req, res) => {
    logger.info(`[ROUTES] PATCH /api/v1/change_setup_label/${req.params.uuid} - Route handler started`);
    return changeSetupLabelsController.patchChangeSetupLabel(req, res);
});

module.exports = router;
