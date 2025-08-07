const express = require('express');
const router = express.Router();
const entitySetupController = require('./controller');
const validation = require('./validation');
const logger = require('../../../config/logger');

/**
 * @route GET /api/v1/entity_setup
 * @desc Récupère tous les entity_setup_codes avec leurs traductions
 * @access Public
 */
router.get('/', validation.validateGetAllEntitySetup, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/entity_setup - Route accessed');
    entitySetupController.getAllEntitySetup(req, res);
});

/**
 * @route GET /api/v1/entity_setup/:uuid
 * @desc Récupère un entity_setup_code par UUID avec toutes ses traductions
 * @access Public
 */
router.get('/:uuid', validation.validateGetEntitySetupByUuid, (req, res) => {
    logger.info(`[ROUTES] GET /api/v1/entity_setup/${req.params.uuid} - Route accessed`);
    entitySetupController.getEntitySetupByUuid(req, res);
});

/**
 * @route PATCH /api/v1/entity_setup/:uuid
 * @desc Met à jour un entity_setup_code
 * @access Public
 */
router.patch('/:uuid', validation.validateUpdateEntitySetup, (req, res) => {
    logger.info(`[ROUTES] PATCH /api/v1/entity_setup/${req.params.uuid} - Route accessed`);
    entitySetupController.updateEntitySetup(req, res);
});

/**
 * @route POST /api/v1/entity_setup
 * @desc Crée un nouveau entity_setup_code
 * @access Public
 */
router.post('/', validation.validateCreateEntitySetup, (req, res) => {
    logger.info('[ROUTES] POST /api/v1/entity_setup - Route accessed');
    entitySetupController.createEntitySetup(req, res);
});

module.exports = router;
