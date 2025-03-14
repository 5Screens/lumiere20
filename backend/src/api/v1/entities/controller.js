const entityService = require('./service');
const logger = require('../../../config/logger');
const { validateEntity, validateEntityPatch } = require('./validation');

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
                error: 'An error occurred while retrieving entities' 
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
                    error: 'Entity not found'
                });
            }
            
            logger.info(`[CONTROLLER] getEntityByUuid - Successfully retrieved entity with UUID: ${uuid}`);
            return res.json(entity);
        } catch (error) {
            logger.error(`[CONTROLLER] getEntityByUuid - Error: ${error.message}`);
            return res.status(500).json({
                error: 'Error while retrieving entity'
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
                    error: 'Entity not found'
                });
            }
            
            logger.info(`[CONTROLLER] getEntityByEntityId - Successfully retrieved entity with entity_id: ${entityId}`);
            return res.json(entity);
        } catch (error) {
            logger.error(`[CONTROLLER] getEntityByEntityId - Error: ${error.message}`);
            return res.status(500).json({
                error: 'Error while retrieving entity'
            });
        }
    }

    async getChildEntities(req, res) {
        const parentEntityId = req.query.entity_id;
        logger.info(`[CONTROLLER] getChildEntities - Processing request for parent entity_id: ${parentEntityId}`);
        
        if (!parentEntityId) {
            return res.status(400).json({
                error: 'entity_id parameter is required'
            });
        }

        try {
            const result = await entityService.getChildEntities(parentEntityId);
            
            if (!result) {
                logger.warn(`[CONTROLLER] getChildEntities - Parent entity not found with entity_id: ${parentEntityId}`);
                return res.status(404).json({
                    error: 'Parent entity not found'
                });
            }
            
            logger.info(`[CONTROLLER] getChildEntities - Successfully retrieved child entities for parent entity_id: ${parentEntityId}`);
            return res.json(result);
        } catch (error) {
            logger.error(`[CONTROLLER] getChildEntities - Error: ${error.message}`);
            return res.status(500).json({
                error: 'Error while retrieving child entities'
            });
        }
    }

    async createEntity(req, res) {
        logger.info('[CONTROLLER] createEntity - Starting to process request');
        try {
            const entityData = req.body;
            logger.info('[CONTROLLER] createEntity - Validating entity data');
            
            // Validate data
            const { error, value } = validateEntity(entityData);
            if (error) {
                logger.warn(`[CONTROLLER] createEntity - Validation failed: ${error.details.map(d => d.message).join(', ')}`);
                return res.status(400).json({
                    error: 'Invalid entity data',
                    details: error.details.map(d => d.message)
                });
            }
            
            // Check if entity_id already exists
            if (entityData.entity_id) {
                const existingEntity = await entityService.getEntityByEntityId(entityData.entity_id);
                if (existingEntity) {
                    logger.warn(`[CONTROLLER] createEntity - Entity with entity_id ${entityData.entity_id} already exists`);
                    return res.status(409).json({
                        error: `Entity with id ${entityData.entity_id} already exists`
                    });
                }
            }
            
            logger.info('[CONTROLLER] createEntity - Creating new entity');
            const newEntity = await entityService.createEntity(value);
            
            logger.info(`[CONTROLLER] createEntity - Entity created successfully with UUID: ${newEntity.uuid}`);
            return res.status(201).json(newEntity);
        } catch (error) {
            logger.error(`[CONTROLLER] createEntity - Error: ${error.message}`);
            
            if (error.code === '23505') { // PostgreSQL unique constraint violation code
                return res.status(409).json({
                    error: 'Entity with this identifier already exists'
                });
            }
            
            return res.status(500).json({
                error: 'An error occurred while creating the entity'
            });
        }
    }

    async getActiveEntities(req, res) {
        logger.info('[CONTROLLER] getActiveEntities - Starting to process request');
        try {
            const activeEntities = await entityService.getActiveEntities();
            logger.info(`[CONTROLLER] getActiveEntities - Successfully retrieved ${activeEntities.length} active entities`);
            res.json(activeEntities);
        } catch (error) {
            logger.error(`[CONTROLLER] getActiveEntities - Error: ${error.message}`);
            res.status(500).json({ 
                error: 'An error occurred while retrieving active entities' 
            });
        }
    }

    async updateEntityField(req, res) {
        const uuid = req.entityUuid;
        logger.info(`[CONTROLLER] updateEntityField - Processing request for UUID: ${uuid}`);

        try {
            // Validate the entity exists
            const existingEntity = await entityService.getEntityByUuid(uuid);
            if (!existingEntity) {
                logger.warn(`[CONTROLLER] updateEntityField - Entity not found with UUID: ${uuid}`);
                return res.status(404).json({
                    error: 'Entity not found'
                });
            }

            // Validate update data
            const { error, value } = validateEntityPatch(req.body);
            if (error) {
                logger.warn(`[CONTROLLER] updateEntityField - Validation failed: ${error.details.map(d => d.message).join(', ')}`);
                return res.status(400).json({
                    error: 'Invalid update data',
                    details: error.details.map(d => d.message)
                });
            }

            // Update the entity
            const updatedEntity = await entityService.updateEntity(uuid, value);
            logger.info(`[CONTROLLER] updateEntityField - Entity updated successfully: ${uuid}`);
            
            return res.json(updatedEntity);
        } catch (error) {
            logger.error(`[CONTROLLER] updateEntityField - Error: ${error.message}`);
            return res.status(500).json({
                error: 'An error occurred while updating the entity'
            });
        }
    }
}

module.exports = new EntityController();
