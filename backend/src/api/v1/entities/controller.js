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

    async createEntity(req, res) {
        logger.info('[CONTROLLER] createEntity - Starting to process request');
        try {
            const entityData = req.body;
            logger.info('[CONTROLLER] createEntity - Validating entity data');
            
            // Validation des données
            const { error, value } = validateEntity(entityData);
            if (error) {
                logger.warn(`[CONTROLLER] createEntity - Validation failed: ${error.details.map(d => d.message).join(', ')}`);
                return res.status(400).json({
                    success: false,
                    message: 'Données d\'entité invalides',
                    errors: error.details.map(d => d.message)
                });
            }
            
            // Vérification si l'entity_id existe déjà
            if (entityData.entity_id) {
                const existingEntity = await entityService.getEntityByEntityId(entityData.entity_id);
                if (existingEntity) {
                    logger.warn(`[CONTROLLER] createEntity - Entity with entity_id ${entityData.entity_id} already exists`);
                    return res.status(409).json({
                        success: false,
                        message: `Une entité avec l'identifiant ${entityData.entity_id} existe déjà`
                    });
                }
            }
            
            logger.info('[CONTROLLER] createEntity - Creating new entity');
            const newEntity = await entityService.createEntity(value);
            
            logger.info(`[CONTROLLER] createEntity - Entity created successfully with UUID: ${newEntity.uuid}`);
            return res.status(201).json({
                success: true,
                message: 'Entité créée avec succès',
                data: newEntity
            });
        } catch (error) {
            logger.error(`[CONTROLLER] createEntity - Error: ${error.message}`);
            
            if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
                return res.status(409).json({
                    success: false,
                    message: 'Une entité avec cet identifiant existe déjà'
                });
            }
            
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la création de l\'entité'
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
        const uuid = req.query.uuid;
        logger.info(`[CONTROLLER] updateEntityField - Processing request for UUID: ${uuid}`);
        
        if (!uuid) {
            logger.warn('[CONTROLLER] updateEntityField - Missing UUID parameter');
            return res.status(400).json({
                success: false,
                message: 'UUID parameter is required'
            });
        }

        // Récupérer les champs à mettre à jour depuis les paramètres de requête
        const allowedFields = ['name', 'entity_id', 'external_id', 'entity_type', 'rel_headquarters_location', 'is_active', 'parent_uuid'];
        const fieldData = {};
        
        // Parcourir les paramètres de requête et extraire les champs autorisés
        for (const field of allowedFields) {
            if (req.query[field] !== undefined) {
                // Conversion spéciale pour le champ booléen is_active
                if (field === 'is_active') {
                    fieldData[field] = req.query[field] === 'true';
                } else {
                    fieldData[field] = req.query[field];
                }
            }
        }

        // Vérifier si des champs à mettre à jour ont été fournis
        if (Object.keys(fieldData).length === 0) {
            logger.warn('[CONTROLLER] updateEntityField - No valid fields to update');
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        try {
            // Validation des données
            const { error, value } = validateEntityPatch(fieldData);
            if (error) {
                logger.warn(`[CONTROLLER] updateEntityField - Validation failed: ${error.details.map(d => d.message).join(', ')}`);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid entity data',
                    errors: error.details.map(d => d.message)
                });
            }

            // Mise à jour de l'entité
            const updatedEntity = await entityService.updateEntityField(uuid, value);
            
            if (!updatedEntity) {
                logger.warn(`[CONTROLLER] updateEntityField - Entity not found with UUID: ${uuid}`);
                return res.status(404).json({
                    success: false,
                    message: 'Entity not found'
                });
            }
            
            logger.info(`[CONTROLLER] updateEntityField - Successfully updated entity with UUID: ${uuid}`);
            return res.status(200).json(updatedEntity);
        } catch (error) {
            logger.error(`[CONTROLLER] updateEntityField - Error: ${error.message}`);
            
            if (error.message.includes('existe déjà')) {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }
            
            return res.status(500).json({
                success: false,
                message: 'An error occurred while updating the entity'
            });
        }
    }
}

module.exports = new EntityController();
