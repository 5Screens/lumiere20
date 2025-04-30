const projectSetupService = require('./service');
const logger = require('../../../config/logger');

/**
 * Récupère les données de configuration des projets
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Données de configuration des projets
 */
const getProjectSetup = async (req, res) => {
    logger.info('[CONTROLLER] Starting to process getProjectSetup request');
    
    try {
        const { lang, metadata, toSelect } = req.query;
        
        const projectSetupData = await projectSetupService.getProjectSetup(lang, metadata, toSelect);
        
        logger.info(`[CONTROLLER] Successfully retrieved project setup data`);
        
        res.json(projectSetupData);
    } catch (error) {
        logger.error(`[CONTROLLER] Error: ${error.message}`);
        res.status(500).json({ 
            error: 'An error occurred while retrieving project setup data' 
        });
    }
};

module.exports = {
    getProjectSetup
};
