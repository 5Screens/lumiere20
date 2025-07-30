const express = require('express');
const router = express.Router();
const symptomsController = require('./controller');
const validate = require('../../../middleware/validate');
const symptomsValidation = require('./validation');
const logger = require('../../../config/logger');

// Route pour obtenir tous les symptômes ou filtrés par langue avec le paramètre lang
//http://localhost:3000/api/v1/symptoms/
//http://localhost:3000/api/v1/symptoms?lang=fr
router.get(
    '/',
    (req, res, next) => {
        if (req.query.lang) {
            logger.info(`[ROUTES] GET /api/v1/symptoms - Route handler started with lang=${req.query.lang}`);
        } else {
            logger.info('[ROUTES] GET /api/v1/symptoms - Route handler started');
        }
        next();
    },
    (req, res, next) => symptomsValidation.validateGetSymptomsWithLang(req, res, next),
    symptomsController.getAllSymptoms
);

// Route pour obtenir les symptômes filtrés par langue
//http://localhost:3000/api/v1/symptoms/by-language?langue=fr
router.get(
    '/by-language',
    (req, res, next) => {
        logger.info(`[ROUTES] GET /api/v1/symptoms/by-language - Route handler started with langue=${req.query.langue}`);
        next();
    },
    validate(symptomsValidation.getSymptoms),
    symptomsController.getSymptoms
);

// Route pour obtenir un symptôme par son code
//http://localhost:3000/api/v1/symptoms/by-scode?scode=VPN_CONNECTION_FAILED
router.get(
    '/by-scode',
    (req, res, next) => {
        logger.info(`[ROUTES] GET /api/v1/symptoms/by-scode - Route handler started with scode=${req.query.scode}`);
        next();
    },
    validate(symptomsValidation.getSymptomByCode),
    symptomsController.getSymptomByCode
);

// Route pour obtenir un symptôme par son UUID
//http://localhost:3000/api/v1/symptoms/550e8400-e29b-41d4-a716-446655440000
//http://localhost:3000/api/v1/symptoms/550e8400-e29b-41d4-a716-446655440000?lang=fr
router.get(
    '/:uuid',
    (req, res, next) => {
        logger.info(`[ROUTES] GET /api/v1/symptoms/:uuid - Route handler started with uuid=${req.params.uuid}, lang=${req.query.lang}`);
        next();
    },
    validate(symptomsValidation.getSymptomByUuid),
    symptomsController.getSymptomByUuid
);

// Route pour mettre à jour un symptôme par son UUID via un PATCH
//http://localhost:3000/api/v1/symptoms/550e8400-e29b-41d4-a716-446655440000
router.patch(
    '/:uuid',
    (req, res, next) => {
        logger.info(`[ROUTES] PATCH /api/v1/symptoms/:uuid - Route handler started with uuid=${req.params.uuid}`);
        next();
    },
    validate(symptomsValidation.updateSymptom),
    symptomsController.updateSymptom
);

// Route pour créer un nouveau symptôme via un POST
//http://localhost:3000/api/v1/symptoms
router.post(
    '/',
    (req, res, next) => {
        logger.info('[ROUTES] POST /api/v1/symptoms - Route handler started');
        next();
    },
    validate(symptomsValidation.createSymptom),
    symptomsController.createSymptom
);

module.exports = router;
