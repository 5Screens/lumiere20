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
        
        const changeSetupData = await changeSetupService.getChangeSetup(lang, metadata, toSelect);
        
        logger.info(`[CONTROLLER] Successfully retrieved change setup data`);
        
        res.json(changeSetupData);
    } catch (error) {
        logger.error(`[CONTROLLER] Error: ${error.message}`);
        res.status(500).json({ 
            error: 'An error occurred while retrieving change setup data' 
        });
    }
};

module.exports = {
    getChangeSetup
};
