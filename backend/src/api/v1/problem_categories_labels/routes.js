const express = require('express');
const router = express.Router();
const { 
    createProblemCategoryLabelController,
    patchProblemCategoryLabelController
} = require('./controller');
const { 
    validateCreateProblemCategoryLabel,
    validatePatchProblemCategoryLabel
} = require('./validation');
const logger = require('../../../config/logger');

// POST créer un nouveau problem_categories_label
router.post('/', validateCreateProblemCategoryLabel, (req, res) => {
    logger.info('[ROUTES] Handling POST request to create problem category label');
    createProblemCategoryLabelController(req, res);
});

// PATCH mettre à jour un problem_categories_label
router.patch('/:uuid', validatePatchProblemCategoryLabel, (req, res) => {
    logger.info(`[ROUTES] Handling PATCH request for problem category label UUID: ${req.params.uuid}`);
    patchProblemCategoryLabelController(req, res);
});

module.exports = router;
