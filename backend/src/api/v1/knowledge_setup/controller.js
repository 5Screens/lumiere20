const knowledgeSetupService = require('./service');
const logger = require('../../../config/logger');

/**
 * Récupère les données de configuration des articles de connaissance
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Données de configuration des articles de connaissance
 */
const getKnowledgeSetup = async (req, res) => {
    logger.info('[CONTROLLER] Starting to process getKnowledgeSetup request');
    
    try {
        const { lang, metadata, toSelect } = req.query;
        
        const knowledgeSetupData = await knowledgeSetupService.getKnowledgeSetup(lang, metadata, toSelect);
        
        logger.info(`[CONTROLLER] Successfully retrieved knowledge setup data`);
        
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
        logger.error(`[CONTROLLER] Error: ${error.message}`);
        res.status(500).json({ 
            error: 'An error occurred while retrieving knowledge setup data' 
        });
    }
};

module.exports = {
    getKnowledgeSetup
};
