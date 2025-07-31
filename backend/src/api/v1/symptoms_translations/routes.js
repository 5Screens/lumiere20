const express = require('express');
const router = express.Router();
const symptomsTranslationsController = require('./controller');
const validate = require('../../../middleware/validate');
const symptomsTranslationsValidation = require('./validation');
const logger = require('../../../config/logger');

// Route PATCH pour mettre à jour le label d'une traduction de symptôme par son UUID
//http://localhost:3000/api/v1/symptoms_translations/bbd05e49-34d9-47bd-add8-fceaacaca6e2
router.patch(
    '/:uuid',
    (req, res, next) => {
        logger.info(`[ROUTES] PATCH /api/v1/symptoms_translations/${req.params.uuid} - Route handler started`);
        next();
    },
    validate(symptomsTranslationsValidation.patchSymptomTranslation),
    symptomsTranslationsController.patchSymptomTranslation
);

module.exports = router;
