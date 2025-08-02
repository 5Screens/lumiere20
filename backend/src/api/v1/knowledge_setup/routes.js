const express = require('express');
const router = express.Router();
const knowledgeSetupController = require('./controller');
const { 
    validateGetKnowledgeSetupQuery,
    validateKnowledgeSetupUuid,
    validateCreateKnowledgeSetup,
    validateUpdateKnowledgeSetup
} = require('./validation');
const logger = require('../../../config/logger');

// GET /api/v1/knowledge_setup - Récupère tous les knowledge setup
router.get('/', validateGetKnowledgeSetupQuery, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/knowledge_setup - Route handler started');
    
    // Si le paramètre metadata est présent, utiliser getKnowledgeSetup
    if (req.query.metadata) {
        logger.info('[ROUTES] GET /api/v1/knowledge_setup - Using getKnowledgeSetup due to metadata parameter');
        return knowledgeSetupController.getKnowledgeSetup(req, res);
    }
    
    // Sinon, utiliser getAllKnowledgeSetup
    return knowledgeSetupController.getAllKnowledgeSetup(req, res);
});

// GET /api/v1/knowledge_setup/:uuid - Récupère un knowledge setup par UUID
router.get('/:uuid', validateKnowledgeSetupUuid, (req, res) => {
    logger.info(`[ROUTES] GET /api/v1/knowledge_setup/${req.params.uuid} - Route handler started`);
    return knowledgeSetupController.getKnowledgeSetupByUuid(req, res);
});

// POST /api/v1/knowledge_setup - Crée un nouveau knowledge setup
router.post('/', validateCreateKnowledgeSetup, (req, res) => {
    logger.info('[ROUTES] POST /api/v1/knowledge_setup - Route handler started');
    return knowledgeSetupController.createKnowledgeSetup(req, res);
});

// PATCH /api/v1/knowledge_setup/:uuid - Met à jour un knowledge setup
router.patch('/:uuid', validateKnowledgeSetupUuid, validateUpdateKnowledgeSetup, (req, res) => {
    logger.info(`[ROUTES] PATCH /api/v1/knowledge_setup/${req.params.uuid} - Route handler started`);
    return knowledgeSetupController.updateKnowledgeSetup(req, res);
});

// Route legacy pour compatibilité
router.get('/legacy', validateGetKnowledgeSetupQuery, (req, res) => {
    logger.info('[ROUTES] GET /api/v1/knowledge_setup/legacy - Legacy route handler started');
    return knowledgeSetupController.getKnowledgeSetup(req, res);
});

module.exports = router;
