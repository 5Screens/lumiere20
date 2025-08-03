const express = require('express');
const router = express.Router();
const changeQuestionLabelsController = require('./controller');
const { validateCreateChangeQuestionLabel, validatePatchChangeQuestionLabel } = require('./validation');
const logger = require('../../../config/logger');

// POST /api/v1/change_questions_labels - Crée un nouveau change_questions_label
router.post('/', validateCreateChangeQuestionLabel, (req, res) => {
    logger.info('[ROUTES] POST /api/v1/change_questions_labels - Route handler started');
    return changeQuestionLabelsController.createChangeQuestionLabel(req, res);
});

// PATCH /api/v1/change_questions_labels/:uuid - Met à jour un change_questions_label
router.patch('/:uuid', validatePatchChangeQuestionLabel, (req, res) => {
    logger.info(`[ROUTES] PATCH /api/v1/change_questions_labels/${req.params.uuid} - Route handler started`);
    return changeQuestionLabelsController.patchChangeQuestionLabel(req, res);
});

module.exports = router;
