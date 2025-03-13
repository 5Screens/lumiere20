const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class EntityService {
    async getAllEntities() {
        logger.info('[SERVICE] getAllEntities - Starting database query');
        try {
            const query = `
                SELECT 
                    e.uuid, 
                    e.entity_id,
                    e.name, 
                    parent.name as parent_entity_name,
                    e.external_id, 
                    e.entity_type,
                    e.rel_headquarters_location,
                    loc.name as headquarters_location_name,
                    e.is_active,
                    CASE 
                        WHEN e.budget_approver_uuid IS NULL THEN NULL 
                        ELSE CONCAT(p.first_name, ' ', p.last_name) 
                    END as budget_approver_name,
                    e.date_creation,
                    e.date_modification
                FROM configuration.entities e
                LEFT JOIN configuration.persons p ON e.budget_approver_uuid = p.uuid
                LEFT JOIN configuration.entities parent ON e.parent_uuid = parent.uuid
                LEFT JOIN configuration.locations loc ON e.rel_headquarters_location = loc.uuid
                ORDER BY e.name ASC`;
            
            const result = await pool.query(query);
            logger.info(`[SERVICE] getAllEntities - Query executed successfully, found ${result.rows.length} records`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getAllEntities - Database error: ${error.message}`);
            throw error;
        }
    }

    async getEntityByUuid(uuid) {
        logger.info(`[SERVICE] getEntityByUuid - Starting database query for UUID: ${uuid}`);
        try {
            const query = `
                SELECT 
                    e.uuid, 
                    e.entity_id,
                    e.name, 
                    e.parent_uuid as parent_uuid,
                    parent.name as parent_entity_name,
                    e.external_id, 
                    e.entity_type,
                    e.rel_headquarters_location,
                    loc.name as headquarters_location_name,
                    e.is_active,
                    CASE 
                        WHEN e.budget_approver_uuid IS NULL THEN NULL 
                        ELSE CONCAT(p.first_name, ' ', p.last_name) 
                    END as budget_approver_name,
                    e.date_creation,
                    e.date_modification
                FROM configuration.entities e
                LEFT JOIN configuration.entities parent ON e.parent_uuid = parent.uuid
                LEFT JOIN configuration.persons p ON e.budget_approver_uuid = p.uuid
                LEFT JOIN configuration.locations loc ON e.rel_headquarters_location = loc.uuid
                WHERE e.uuid = $1`;
            
            const result = await pool.query(query, [uuid]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] getEntityByUuid - Error: ${error.message}`);
            throw error;
        }
    }

    async getEntityByEntityId(entityId) {
        logger.info(`[SERVICE] getEntityByEntityId - Starting database query for entity_id: ${entityId}`);
        try {
            const query = `
                SELECT 
                    e.uuid, 
                    e.entity_id,
                    e.name, 
                    parent.name as parent_entity_name,
                    e.external_id, 
                    e.entity_type,
                    e.rel_headquarters_location,
                    e.is_active,
                    CASE 
                        WHEN e.budget_approver_uuid IS NULL THEN NULL 
                        ELSE CONCAT(p.first_name, ' ', p.last_name) 
                    END as budget_approver_name,
                    e.date_creation,
                    e.date_modification
                FROM configuration.entities e
                LEFT JOIN configuration.entities parent ON e.parent_uuid = parent.uuid
                LEFT JOIN configuration.persons p ON e.budget_approver_uuid = p.uuid
                WHERE e.entity_id = $1`;
            
            const result = await pool.query(query, [entityId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] getEntityByEntityId - Error: ${error.message}`);
            throw error;
        }
    }

    async getChildEntities(parentEntityId) {
        logger.info(`[SERVICE] getChildEntities - Starting database query for parent entity_id: ${parentEntityId}`);
        try {
            // D'abord, on récupère l'UUID de l'entité parent
            const parentQuery = `
                SELECT uuid 
                FROM configuration.entities 
                WHERE entity_id = $1`;
            
            const parentResult = await pool.query(parentQuery, [parentEntityId]);
            
            if (parentResult.rows.length === 0) {
                return null; // Parent non trouvé
            }
            
            const parentUuid = parentResult.rows[0].uuid;
            
            // Ensuite, on récupère toutes les entités enfants
            const childrenQuery = `
                SELECT 
                    e.uuid, 
                    e.entity_id,
                    e.name, 
                    e.external_id, 
                    e.entity_type,
                    e.rel_headquarters_location,
                    e.is_active,
                    CASE 
                        WHEN e.budget_approver_uuid IS NULL THEN NULL 
                        ELSE CONCAT(p.first_name, ' ', p.last_name) 
                    END as budget_approver_name,
                    e.date_creation,
                    e.date_modification
                FROM configuration.entities e
                LEFT JOIN configuration.persons p ON e.budget_approver_uuid = p.uuid
                WHERE e.parent_uuid = $1
                ORDER BY e.name ASC`;
            
            const childrenResult = await pool.query(childrenQuery, [parentUuid]);
            
            return {
                parent_entity_id: parentEntityId,
                children: childrenResult.rows
            };
        } catch (error) {
            logger.error(`[SERVICE] getChildEntities - Error: ${error.message}`);
            throw error;
        }
    }

    async createEntity(entityData) {
        logger.info('[SERVICE] createEntity - Starting database operation');
        try {
            const {
                name,
                entity_id,
                external_id,
                entity_type,
                budget_approver_uuid,
                rel_headquarters_location,
                is_active,
                parent_uuid
            } = entityData;

            const query = `
                INSERT INTO configuration.entities (
                    name,
                    entity_id,
                    external_id,
                    entity_type,
                    budget_approver_uuid,
                    rel_headquarters_location,
                    is_active,
                    parent_uuid
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING 
                    uuid,
                    name,
                    entity_id,
                    external_id,
                    entity_type,
                    budget_approver_uuid,
                    rel_headquarters_location,
                    is_active,
                    parent_uuid,
                    date_creation,
                    date_modification`;

            const values = [
                name,
                entity_id,
                external_id,
                entity_type,
                budget_approver_uuid,
                rel_headquarters_location,
                is_active !== undefined ? is_active : true,
                parent_uuid
            ];

            logger.info(`[SERVICE] createEntity - Executing query with values: ${JSON.stringify(values)}`);
            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error('Erreur lors de la création de l\'entité');
            }
            
            const newEntity = result.rows[0];
            logger.info(`[SERVICE] createEntity - Entity created successfully with UUID: ${newEntity.uuid}`);
            
            // Si l'entité a un parent, récupérons le nom du parent pour l'inclure dans la réponse
            if (newEntity.parent_uuid) {
                const parentQuery = `
                    SELECT name 
                    FROM configuration.entities 
                    WHERE uuid = $1`;
                
                const parentResult = await pool.query(parentQuery, [newEntity.parent_uuid]);
                
                if (parentResult.rows.length > 0) {
                    newEntity.parent_entity_name = parentResult.rows[0].name;
                }
            }
            
            // Si l'entité a un budget_approver, récupérons son nom pour l'inclure dans la réponse
            if (newEntity.budget_approver_uuid) {
                const approverQuery = `
                    SELECT CONCAT(first_name, ' ', last_name) as budget_approver_name
                    FROM configuration.persons 
                    WHERE uuid = $1`;
                
                const approverResult = await pool.query(approverQuery, [newEntity.budget_approver_uuid]);
                
                if (approverResult.rows.length > 0) {
                    newEntity.budget_approver_name = approverResult.rows[0].budget_approver_name;
                }
            }
            
            return newEntity;
        } catch (error) {
            logger.error(`[SERVICE] createEntity - Database error: ${error.message}`);
            throw error;
        }
    }

    async getActiveEntities() {
        logger.info('[SERVICE] getActiveEntities - Starting database query for active entities');
        try {
            const query = `
                SELECT 
                    e.uuid, 
                    e.entity_id,
                    e.name, 
                    parent.name as parent_entity_name,
                    e.external_id, 
                    e.entity_type,
                    e.rel_headquarters_location,
                    e.is_active,
                    CASE 
                        WHEN e.budget_approver_uuid IS NULL THEN NULL 
                        ELSE CONCAT(p.first_name, ' ', p.last_name) 
                    END as budget_approver_name,
                    e.date_creation,
                    e.date_modification
                FROM configuration.entities e
                LEFT JOIN configuration.persons p ON e.budget_approver_uuid = p.uuid
                LEFT JOIN configuration.entities parent ON e.parent_uuid = parent.uuid
                WHERE e.is_active = true
                ORDER BY e.name ASC`;
            
            const result = await pool.query(query);
            logger.info(`[SERVICE] getActiveEntities - Query executed successfully, found ${result.rows.length} active entities`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getActiveEntities - Database error: ${error.message}`);
            throw error;
        }
    }

    async updateEntityField(uuid, fieldData) {
        logger.info(`[SERVICE] updateEntityField - Starting database operation for UUID: ${uuid}`);
        try {
            // Vérifier si l'entité existe
            const entityExists = await this.getEntityByUuid(uuid);
            if (!entityExists) {
                logger.warn(`[SERVICE] updateEntityField - Entity with UUID ${uuid} not found`);
                return null;
            }

            // Construire la requête dynamique
            const fields = Object.keys(fieldData);
            const values = Object.values(fieldData);
            
            // Vérifier si entity_id est mis à jour et s'il existe déjà
            if (fieldData.entity_id) {
                const existingEntity = await this.getEntityByEntityId(fieldData.entity_id);
                if (existingEntity && existingEntity.uuid !== uuid) {
                    logger.warn(`[SERVICE] updateEntityField - Entity with entity_id ${fieldData.entity_id} already exists`);
                    throw new Error(`Une entité avec l'identifiant ${fieldData.entity_id} existe déjà`);
                }
            }

            // Construire les parties SET de la requête
            const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            
            const query = `
                UPDATE configuration.entities
                SET ${setClause}, date_modification = NOW()
                WHERE uuid = $${fields.length + 1}
                RETURNING 
                    uuid,
                    name,
                    entity_id,
                    external_id,
                    entity_type,
                    budget_approver_uuid,
                    rel_headquarters_location,
                    is_active,
                    parent_uuid,
                    date_creation,
                    date_modification`;

            const queryValues = [...values, uuid];
            logger.info(`[SERVICE] updateEntityField - Executing query with values: ${JSON.stringify(queryValues)}`);
            
            const result = await pool.query(query, queryValues);
            
            if (result.rows.length === 0) {
                throw new Error('Error updating entity field');
            }
            
            const updatedEntity = result.rows[0];
            logger.info(`[SERVICE] updateEntityField - Entity updated successfully with UUID: ${updatedEntity.uuid}`);
            
            // Si l'entité a un parent, récupérons le nom du parent pour l'inclure dans la réponse
            if (updatedEntity.parent_uuid) {
                const parentQuery = `
                    SELECT name 
                    FROM configuration.entities 
                    WHERE uuid = $1`;
                
                const parentResult = await pool.query(parentQuery, [updatedEntity.parent_uuid]);
                
                if (parentResult.rows.length > 0) {
                    updatedEntity.parent_entity_name = parentResult.rows[0].name;
                }
            }
            
            // Si l'entité a un budget_approver, récupérons son nom pour l'inclure dans la réponse
            if (updatedEntity.budget_approver_uuid) {
                const approverQuery = `
                    SELECT CONCAT(first_name, ' ', last_name) as budget_approver_name
                    FROM configuration.persons 
                    WHERE uuid = $1`;
                
                const approverResult = await pool.query(approverQuery, [updatedEntity.budget_approver_uuid]);
                
                if (approverResult.rows.length > 0) {
                    updatedEntity.budget_approver_name = approverResult.rows[0].budget_approver_name;
                }
            }
            
            return updatedEntity;
        } catch (error) {
            logger.error(`[SERVICE] updateEntityField - Database error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new EntityService();
