const entitiesTypesService = require('./service');
const logger = require('../../../config/logger');
const { validateLanguageParam } = require('./validation');

class EntitiesTypesController {
    /**
     * Récupère tous les types d'entités avec leurs libellés dans la langue spécifiée
     * @param {Object} req - Requête Express
     * @param {Object} res - Réponse Express
     * @returns {Object} Réponse JSON
     */
    async getEntityTypesByLanguage(req, res) {
        logger.info('[CONTROLLER] getEntityTypesByLanguage - Starting to process request');
        
        // Validation du paramètre de langue
        const validation = validateLanguageParam(req);
        if (validation.error) {
            logger.warn(`[CONTROLLER] getEntityTypesByLanguage - Validation error: ${validation.error.message}`);
            return res.status(400).json({
                message: `Paramètre de langue invalide: ${validation.error.message}`
            });
        }
        
        const langue = req.query.langue;
        logger.info(`[CONTROLLER] getEntityTypesByLanguage - Processing request for language: ${langue}`);
        
        try {
            const entityTypes = await entitiesTypesService.getEntityTypesByLanguage(langue);
            
            if (entityTypes.length === 0) {
                logger.warn(`[CONTROLLER] getEntityTypesByLanguage - No entity types found for language: ${langue}`);
                return res.status(404).json({
                    message: `Aucun type d'entité trouvé pour la langue: ${langue}`
                });
            }
            
            logger.info(`[CONTROLLER] getEntityTypesByLanguage - Successfully retrieved ${entityTypes.length} entity types for language: ${langue}`);
            return res.status(200).json(entityTypes);
        } catch (error) {
            logger.error(`[CONTROLLER] getEntityTypesByLanguage - Error: ${error.message}`);
            return res.status(500).json({
                message: `Erreur lors de la récupération des types d'entités: ${error.message}`
            });
        }
    }
}

module.exports = new EntitiesTypesController();
