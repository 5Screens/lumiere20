const entitiesTypesService = require('./service');
const logger = require('../../../config/logger');
const { validateLanguageParam } = require('./validation');

class EntitiesTypesController {
    /**
     * Get all entity types with their labels in the specified language
     * @param {Object} req - Express Request
     * @param {Object} res - Express Response
     * @returns {Object} JSON Response
     */
    async getEntityTypesByLanguage(req, res) {
        logger.info('[CONTROLLER] getEntityTypesByLanguage - Starting to process request');
        
        // Validate language parameter
        const validation = validateLanguageParam(req);
        if (validation.error) {
            logger.warn(`[CONTROLLER] getEntityTypesByLanguage - Validation error: ${validation.error.message}`);
            return res.status(400).json({
                message: `Invalid language parameter: ${validation.error.message}`
            });
        }
        
        const langue = req.query.langue;
        logger.info(`[CONTROLLER] getEntityTypesByLanguage - Processing request for language: ${langue}`);
        
        try {
            const entityTypes = await entitiesTypesService.getEntityTypesByLanguage(langue);
            
            if (entityTypes.length === 0) {
                logger.warn(`[CONTROLLER] getEntityTypesByLanguage - No entity types found for language: ${langue}`);
                return res.status(404).json({
                    message: `No entity types found for language: ${langue}`
                });
            }
            
            logger.info(`[CONTROLLER] getEntityTypesByLanguage - Successfully retrieved ${entityTypes.length} entity types for language: ${langue}`);
            return res.status(200).json(entityTypes);
        } catch (error) {
            logger.error(`[CONTROLLER] getEntityTypesByLanguage - Error: ${error.message}`);
            return res.status(500).json({
                message: `Error retrieving entity types: ${error.message}`
            });
        }
    }

    /**
     * Get all entity types formatted for select field component
     * @param {Object} req - Express Request
     * @param {Object} res - Express Response
     * @returns {Object} JSON Response with label/value format
     */
    async getEntityTypesForSelect(req, res) {
        logger.info('[CONTROLLER] getEntityTypesForSelect - Starting to process request');
        
        // Validate language parameter
        const validation = validateLanguageParam(req);
        if (validation.error) {
            logger.warn(`[CONTROLLER] getEntityTypesForSelect - Validation error: ${validation.error.message}`);
            return res.status(400).json({
                message: `Invalid language parameter: ${validation.error.message}`
            });
        }
        
        const langue = req.query.langue;
        logger.info(`[CONTROLLER] getEntityTypesForSelect - Processing request for language: ${langue}`);
        
        try {
            const entityTypes = await entitiesTypesService.getEntityTypesByLanguage(langue);
            
            if (entityTypes.length === 0) {
                logger.warn(`[CONTROLLER] getEntityTypesForSelect - No entity types found for language: ${langue}`);
                return res.status(404).json({
                    message: `No entity types found for language: ${langue}`
                });
            }
            
            // Transform data to label/value format for select field
            const formattedTypes = entityTypes.map(type => ({
                label: type.libelle,
                value: type.entity_type
            }));
            
            logger.info(`[CONTROLLER] getEntityTypesForSelect - Successfully formatted ${formattedTypes.length} entity types for select field`);
            return res.status(200).json(formattedTypes);
        } catch (error) {
            logger.error(`[CONTROLLER] getEntityTypesForSelect - Error: ${error.message}`);
            return res.status(500).json({
                message: `Error retrieving entity types: ${error.message}`
            });
        }
    }
}

module.exports = new EntitiesTypesController();
