const knowledgeSetupService = require('./service');
const logger = require('../../../config/logger');

/**
 * Récupère tous les knowledge setup avec traductions
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getAllKnowledgeSetup = async (req, res) => {
    logger.info('[CONTROLLER] getAllKnowledgeSetup - Starting to process request');
    
    try {
        const { lang } = req.query;
        logger.info(`[CONTROLLER] getAllKnowledgeSetup - Language parameter: ${lang || 'all'}`);
        
        const knowledgeSetupData = await knowledgeSetupService.getAllKnowledgeSetup(lang);
        
        logger.info(`[CONTROLLER] getAllKnowledgeSetup - Successfully retrieved ${knowledgeSetupData.length} knowledge setup records`);
        
        // Si la requête est un GET sans paramètres de requête, on ajoute des métadonnées
        const hasQueryParams = Object.keys(req.query).length > 0;
        
        if (!hasQueryParams) {
            return res.json({
                metadata: {
                    timestamp: new Date().toISOString(),
                    count: knowledgeSetupData.length
                },
                data: knowledgeSetupData
            });
        }
        
        // Sinon, on renvoie directement les données sans métadonnées
        res.json(knowledgeSetupData);
    } catch (error) {
        logger.error(`[CONTROLLER] getAllKnowledgeSetup - Error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'An error occurred while retrieving knowledge setup data',
            error: error.message
        });
    }
};

/**
 * Récupère un knowledge setup par son UUID
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getKnowledgeSetupByUuid = async (req, res) => {
    logger.info('[CONTROLLER] getKnowledgeSetupByUuid - Starting to process request');
    
    try {
        const { uuid } = req.params;
        const { lang } = req.query;
        
        logger.info(`[CONTROLLER] getKnowledgeSetupByUuid - UUID: ${uuid}, Language: ${lang || 'all'}`);
        
        if (!uuid) {
            logger.warn('[CONTROLLER] getKnowledgeSetupByUuid - UUID parameter is missing');
            return res.status(400).json({
                success: false,
                message: 'UUID parameter is required'
            });
        }
        
        const knowledgeSetup = await knowledgeSetupService.getKnowledgeSetupByUuid(uuid, lang);
        
        if (!knowledgeSetup) {
            logger.warn(`[CONTROLLER] getKnowledgeSetupByUuid - Knowledge setup not found for UUID: ${uuid}`);
            return res.status(404).json({
                success: false,
                message: 'Knowledge setup not found'
            });
        }
        
        logger.info(`[CONTROLLER] getKnowledgeSetupByUuid - Successfully retrieved knowledge setup for UUID: ${uuid}`);
        res.json(knowledgeSetup);
    } catch (error) {
        logger.error(`[CONTROLLER] getKnowledgeSetupByUuid - Error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving knowledge setup',
            error: error.message
        });
    }
};

/**
 * Met à jour un knowledge setup
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const updateKnowledgeSetup = async (req, res) => {
    logger.info('[CONTROLLER] updateKnowledgeSetup - Starting to process request');
    
    try {
        const { uuid } = req.params;
        const knowledgeSetupData = req.body;
        
        logger.info(`[CONTROLLER] updateKnowledgeSetup - UUID: ${uuid}`);
        
        if (!uuid) {
            logger.warn('[CONTROLLER] updateKnowledgeSetup - UUID parameter is missing');
            return res.status(400).json({
                success: false,
                message: 'UUID parameter is required'
            });
        }
        
        const updatedKnowledgeSetup = await knowledgeSetupService.updateKnowledgeSetup(uuid, knowledgeSetupData);
        
        logger.info(`[CONTROLLER] updateKnowledgeSetup - Successfully updated knowledge setup for UUID: ${uuid}`);
        res.json({
            success: true,
            message: 'Knowledge setup updated successfully',
            data: updatedKnowledgeSetup
        });
    } catch (error) {
        logger.error(`[CONTROLLER] updateKnowledgeSetup - Error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating knowledge setup',
            error: error.message
        });
    }
};

/**
 * Crée un nouveau knowledge setup
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const createKnowledgeSetup = async (req, res) => {
    logger.info('[CONTROLLER] createKnowledgeSetup - Starting to process request');
    
    try {
        const knowledgeSetupData = req.body;
        
        logger.info(`[CONTROLLER] createKnowledgeSetup - Creating knowledge setup with code: ${knowledgeSetupData.code}`);
        
        const newKnowledgeSetup = await knowledgeSetupService.createKnowledgeSetup(knowledgeSetupData);
        
        logger.info(`[CONTROLLER] createKnowledgeSetup - Successfully created knowledge setup with UUID: ${newKnowledgeSetup.uuid}`);
        res.status(201).json({
            success: true,
            message: 'Knowledge setup created successfully',
            data: newKnowledgeSetup
        });
    } catch (error) {
        logger.error(`[CONTROLLER] createKnowledgeSetup - Error: ${error.message}`);
        
        // Gestion spécifique de l'erreur de contrainte unique
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Un knowledge setup avec ce code existe déjà'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating knowledge setup',
            error: error.message
        });
    }
};

/**
 * Méthode legacy pour compatibilité
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getKnowledgeSetup = async (req, res) => {
    logger.info('[CONTROLLER] getKnowledgeSetup (legacy) - Starting to process request');
    
    try {
        const { lang, metadata, toSelect } = req.query;
        
        const knowledgeSetupData = await knowledgeSetupService.getKnowledgeSetup(lang, metadata, toSelect);
        
        logger.info(`[CONTROLLER] getKnowledgeSetup (legacy) - Successfully retrieved knowledge setup data`);
        res.json(knowledgeSetupData);
    } catch (error) {
        logger.error(`[CONTROLLER] getKnowledgeSetup (legacy) - Error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'An error occurred while retrieving knowledge setup data',
            error: error.message
        });
    }
};

module.exports = {
    getAllKnowledgeSetup,
    getKnowledgeSetupByUuid,
    updateKnowledgeSetup,
    createKnowledgeSetup,
    getKnowledgeSetup
};
