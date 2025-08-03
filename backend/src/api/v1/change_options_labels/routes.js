const express = require('express');
const router = express.Router();
const changeOptionLabelsController = require('./controller');
const { 
    validateCreateChangeOptionLabel,
    validatePatchChangeOptionLabel
} = require('./validation');
const logger = require('../../../config/logger');

// POST /api/v1/change_options_labels - Créer un nouveau change_options_label
router.post('/', validateCreateChangeOptionLabel, (req, res) => {
    logger.info('[ROUTES] POST /api/v1/change_options_labels - Route handler started');
    return changeOptionLabelsController.createChangeOptionLabel(req, res);
});

// PATCH /api/v1/change_options_labels/:uuid - Mettre à jour un change_options_label
router.patch('/:uuid', validatePatchChangeOptionLabel, (req, res) => {
    logger.info(`[ROUTES] PATCH /api/v1/change_options_labels/${req.params.uuid} - Route handler started`);
    return changeOptionLabelsController.patchChangeOptionLabel(req, res);
});

module.exports = router;
