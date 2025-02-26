const express = require('express');
const router = express.Router();
const symptomsTranslationsController = require('./controller');
const validate = require('../../../middleware/validate');
const symptomsTranslationsValidation = require('./validation');
const logger = require('../../../config/logger');

// Route pour mettre à jour le libellé d'une traduction de symptôme par son UUID
//http://localhost:3000/api/v1/symptoms_translations/b1ff328e-752d-423f-9726-4f1245dd24ab
router.put(
    '/:uuid',
    (req, res, next) => {
        logger.info(`[ROUTES] PUT /api/v1/symptoms_translations/${req.params.uuid} - Route handler started`);
        next();
    },
    validate(symptomsTranslationsValidation.updateSymptomTranslation),
    symptomsTranslationsController.updateSymptomTranslation
);

module.exports = router;
