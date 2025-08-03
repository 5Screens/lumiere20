const changeSetupService = require('./service');
const logger = require('../../../config/logger');

/**
 * Récupère les données de configuration des changements
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Données de configuration des changements
 */
const getChangeSetup = async (req, res) => {
    logger.info('[CONTROLLER] Starting to process getChangeSetup request');
    
    try {
        const { lang, metadata, toSelect } = req.query;
        
        // Si metadata est fourni, utiliser la méthode legacy getChangeSetup
        if (metadata) {
            const changeSetupData = await changeSetupService.getChangeSetup(lang, metadata, toSelect);
            logger.info(`[CONTROLLER] Successfully retrieved change setup data with metadata filter`);
            return res.json(changeSetupData);
        }
        
        // Sinon, utiliser la nouvelle méthode getAllChangeSetup
        const changeSetupData = await changeSetupService.getAllChangeSetup(lang || 'fr');
        logger.info(`[CONTROLLER] Successfully retrieved all change setup data`);
        
        res.json(changeSetupData);
    } catch (error) {
        logger.error(`[CONTROLLER] Error: ${error.message}`);
        res.status(500).json({ 
            error: 'An error occurred while retrieving change setup data' 
        });
    }
};

/**
 * Récupère un change_setup par UUID
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Change setup avec ses traductions
 */
const getChangeSetupByUuid = async (req, res) => {
    logger.info('[CONTROLLER] Starting to process getChangeSetupByUuid request');
    
    try {
        const { uuid } = req.params;
        const { lang } = req.query;
        
        logger.info(`[CONTROLLER] Retrieving change setup with UUID: ${uuid}, language: ${lang || 'all'}`);
        
        const changeSetup = await changeSetupService.getChangeSetupByUuid(uuid, lang);
        
        if (!changeSetup) {
            logger.info(`[CONTROLLER] Change setup not found with UUID: ${uuid}`);
            return res.status(404).json({
                success: false,
                message: 'Change setup not found'
            });
        }
        
        logger.info(`[CONTROLLER] Successfully retrieved change setup with UUID: ${uuid}`);
        res.json(changeSetup);
    } catch (error) {
        logger.error(`[CONTROLLER] Error retrieving change setup: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving change setup'
        });
    }
};

/**
 * Met à jour un change_setup
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Change setup mis à jour
 */
const updateChangeSetup = async (req, res) => {
    logger.info('[CONTROLLER] Starting to process updateChangeSetup request');
    
    try {
        const { uuid } = req.params;
        const changeSetupData = req.body;
        
        logger.info(`[CONTROLLER] Updating change setup with UUID: ${uuid}`);
        logger.info(`[CONTROLLER] Update data: ${JSON.stringify(changeSetupData)}`);
        
        const updatedChangeSetup = await changeSetupService.updateChangeSetup(uuid, changeSetupData);
        
        logger.info(`[CONTROLLER] Successfully updated change setup with UUID: ${uuid}`);
        res.json({
            success: true,
            data: updatedChangeSetup
        });
    } catch (error) {
        logger.error(`[CONTROLLER] Error updating change setup: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Un change setup avec ce code existe déjà'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating change setup'
        });
    }
};

/**
 * Crée un nouveau change_setup
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Change setup créé
 */
const createChangeSetup = async (req, res) => {
    logger.info('[CONTROLLER] Starting to process createChangeSetup request');
    
    try {
        const changeSetupData = req.body;
        
        logger.info(`[CONTROLLER] Creating change setup with code: ${changeSetupData.code}`);
        logger.info(`[CONTROLLER] Create data: ${JSON.stringify(changeSetupData)}`);
        
        const createdChangeSetup = await changeSetupService.createChangeSetup(changeSetupData);
        
        logger.info(`[CONTROLLER] Successfully created change setup with code: ${changeSetupData.code}`);
        res.status(201).json({
            success: true,
            data: createdChangeSetup
        });
    } catch (error) {
        logger.error(`[CONTROLLER] Error creating change setup: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Un change setup avec ce code existe déjà'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating change setup'
        });
    }
};

module.exports = {
    getChangeSetup,
    getChangeSetupByUuid,
    updateChangeSetup,
    createChangeSetup
};
