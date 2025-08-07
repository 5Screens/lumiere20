const express = require('express');
const router = express.Router();
const entitySetupLabelsController = require('./controller');
const validation = require('./validation');
const logger = require('../../../config/logger');

/**
 * @route POST /api/v1/entity_setup_labels
 * @desc Crée un nouveau entity_setup_label
 * @access Public
 */
router.post('/', validation.validateCreateEntitySetupLabel, (req, res) => {
    logger.info('[ROUTES] POST /api/v1/entity_setup_labels - Route accessed');
    entitySetupLabelsController.createEntitySetupLabel(req, res);
});

/**
 * @route PATCH /api/v1/entity_setup_labels/:uuid
 * @desc Met à jour un entity_setup_label
 * @access Public
 */
router.patch('/:uuid', validation.validatePatchEntitySetupLabel, (req, res) => {
    logger.info(`[ROUTES] PATCH /api/v1/entity_setup_labels/${req.params.uuid} - Route accessed`);
    entitySetupLabelsController.patchEntitySetupLabel(req, res);
});

module.exports = router;
