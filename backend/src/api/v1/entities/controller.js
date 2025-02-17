const entityService = require('./service');
const logger = require('../../../config/logger');

class EntityController {
    async getAllEntities(req, res) {
        logger.info('[CONTROLLER] getAllEntities - Starting to process request');
        try {
            const entities = await entityService.getAllEntities();
            logger.info(`[CONTROLLER] getAllEntities - Successfully retrieved ${entities.length} entities`);
            res.json(entities);
        } catch (error) {
            logger.error(`[CONTROLLER] getAllEntities - Error: ${error.message}`);
            res.status(500).json({ 
                error: 'Une erreur est survenue lors de la récupération des entités' 
            });
        }
    }

    async getEntityByUuid(req, res) {
        const uuid = req.query.uuid;
        logger.info(`[CONTROLLER] getEntityByUuid - Processing request for UUID: ${uuid}`);
        try {
            const entity = await entityService.getEntityByUuid(uuid);
            
            if (!entity) {
                logger.warn(`[CONTROLLER] getEntityByUuid - Entity not found with UUID: ${uuid}`);
                return res.status(404).json({
                    success: false,
                    message: 'Entité non trouvée'
                });
            }
            
            logger.info(`[CONTROLLER] getEntityByUuid - Successfully retrieved entity with UUID: ${uuid}`);
            return res.status(200).json({
                success: true,
                data: entity
            });
        } catch (error) {
            logger.error(`[CONTROLLER] getEntityByUuid - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de l\'entité'
            });
        }
    }

    async getEntityByEntityId(req, res) {
        const entityId = req.query.entity_id;
        logger.info(`[CONTROLLER] getEntityByEntityId - Processing request for entity_id: ${entityId}`);
        try {
            const entity = await entityService.getEntityByEntityId(entityId);
            
            if (!entity) {
                logger.warn(`[CONTROLLER] getEntityByEntityId - Entity not found with entity_id: ${entityId}`);
                return res.status(404).json({
                    success: false,
                    message: 'Entité non trouvée'
                });
            }
            
            logger.info(`[CONTROLLER] getEntityByEntityId - Successfully retrieved entity with entity_id: ${entityId}`);
            return res.status(200).json({
                success: true,
                data: entity
            });
        } catch (error) {
            logger.error(`[CONTROLLER] getEntityByEntityId - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de l\'entité'
            });
        }
    }

    async getChildEntities(req, res) {
        const parentEntityId = req.query.entity_id;
        logger.info(`[CONTROLLER] getChildEntities - Processing request for parent entity_id: ${parentEntityId}`);
        
        if (!parentEntityId) {
            return res.status(400).json({
                success: false,
                message: 'Le paramètre entity_id est requis'
            });
        }

        try {
            const result = await entityService.getChildEntities(parentEntityId);
            
            if (!result) {
                logger.warn(`[CONTROLLER] getChildEntities - Parent entity not found with entity_id: ${parentEntityId}`);
                return res.status(404).json({
                    success: false,
                    message: 'Entité parent non trouvée'
                });
            }
            
            logger.info(`[CONTROLLER] getChildEntities - Successfully retrieved child entities for parent entity_id: ${parentEntityId}`);
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error(`[CONTROLLER] getChildEntities - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des entités enfants'
            });
        }
    }
}

module.exports = new EntityController();
