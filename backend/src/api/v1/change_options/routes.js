const express = require('express');
const router = express.Router();
const changeOptionsController = require('./controller');
const { 
    validateGetChangeOptionsQuery, 
    validateGetChangeOptionByUuid,
    validateUpdateChangeOption,
    validateCreateChangeOption
} = require('./validation');
const logger = require('../../../config/logger');

// GET /api/v1/change_options - Récupérer tous les change_options_codes avec traductions
router.get('/', validateGetChangeOptionsQuery, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/change_options - Route handler started');
    return changeOptionsController.getAllChangeOptions(req, res);
});

// GET /api/v1/change_options/:uuid - Récupérer un change_options_code par UUID
router.get('/:uuid', validateGetChangeOptionByUuid, (req, res) => {
    logger.info(`[ROUTES] GET /api/v1/change_options/${req.params.uuid} - Route handler started`);
    return changeOptionsController.getChangeOptionByUuid(req, res);
});

// POST /api/v1/change_options - Créer un nouveau change_options_code
router.post('/', validateCreateChangeOption, (req, res) => {
    logger.info('[ROUTES] POST /api/v1/change_options - Route handler started');
    return changeOptionsController.createChangeOption(req, res);
});

// PATCH /api/v1/change_options/:uuid - Mettre à jour un change_options_code
router.patch('/:uuid', validateUpdateChangeOption, (req, res) => {
    logger.info(`[ROUTES] PATCH /api/v1/change_options/${req.params.uuid} - Route handler started`);
    return changeOptionsController.updateChangeOption(req, res);
});

// Route legacy pour compatibilité
router.get('/legacy', validateGetChangeOptionsQuery, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/change_options/legacy - Legacy route handler started');
    return changeOptionsController.getChangeOptions(req, res);
});

module.exports = router;
